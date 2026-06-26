#!/usr/bin/env python3
"""Run the full regression suite: lint -> unit tests -> build -> e2e."""

import subprocess
import sys
import time
from pathlib import Path


STEPS = [
    ("Lint", ["python", "scripts/run_lint.py"]),
    ("Unit Tests", ["python", "scripts/run_unit_tests.py"]),
    ("Build", ["python", "scripts/run_build.py"]),
    ("E2E Tests", ["python", "scripts/run_e2e_tests.py"]),
]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    timings = []
    failed_step = None

    for name, cmd in STEPS:
        print(f"\n{'=' * 40}")
        print(f"Running: {name}")
        print(f"{'=' * 40}")

        start = time.time()
        result = subprocess.run(" ".join(cmd), cwd=repo_root, shell=True)
        elapsed = time.time() - start
        elapsed_str = format_elapsed(elapsed)

        if result.returncode == 0:
            timings.append((name, elapsed_str, "PASSED"))
            print(f"{name} completed in {elapsed_str}.")
        else:
            timings.append((name, elapsed_str, "FAILED"))
            failed_step = name
            print(f"{name} FAILED after {elapsed_str}.", file=sys.stderr)
            break

    print(f"\n{'=' * 40}")
    print("Regression Summary")
    print(f"{'=' * 40}")

    for name, elapsed_str, status in timings:
        marker = "PASS" if status == "PASSED" else "FAIL"
        print(f"{name:12} {marker:4} {elapsed_str}")

    if failed_step:
        print(f"\nRegression failed at step: {failed_step}", file=sys.stderr)
        return 1

    print("\nAll regression steps passed.")
    return 0


def format_elapsed(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{minutes:02d}:{secs:02d}.{millis:03d}"


if __name__ == "__main__":
    sys.exit(main())
