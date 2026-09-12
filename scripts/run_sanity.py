#!/usr/bin/env python3
"""Run the per-change check: lint + the critical sanity tests.

This is the command to run after every code change:

    python scripts/run_sanity.py

It runs `scripts/run_lint.py`, then `scripts/run_unit_tests.py --sanity`
(17 critical test files, about ten seconds). The full unit suite and the E2E
suite are for commit time - see `scripts/run_regression.py`.

Everything Node-related goes through the Python wrappers in this directory, so
one approval for this script covers the whole check instead of one prompt per
command.
"""

from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

STEPS = [
    ("Lint", ["scripts/run_lint.py"]),
    ("Sanity tests", ["scripts/run_unit_tests.py", "--sanity"]),
]


def format_elapsed(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{minutes:02d}:{secs:02d}.{millis:03d}"


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    timings = []
    for name, cmd in STEPS:
        print(f"\n{'=' * 40}")
        print(f"Running: {name}")
        print(f"{'=' * 40}")

        start = time.time()
        # Re-enter through the same interpreter, so `python` on PATH is not
        # required and the wrapper scripts stay the only entry points.
        result = subprocess.run([sys.executable] + cmd, cwd=repo_root)
        elapsed = format_elapsed(time.time() - start)

        if result.returncode != 0:
            timings.append((name, elapsed, "FAILED"))
            print(f"\n{name} FAILED after {elapsed}.", file=sys.stderr)
            print("\nSanity check failed - fix this before moving on.", file=sys.stderr)
            return 1

        timings.append((name, elapsed, "PASSED"))
        print(f"{name} passed in {elapsed}.")

    print(f"\n{'=' * 40}")
    print("Sanity summary")
    print(f"{'=' * 40}")
    for name, elapsed, status in timings:
        print(f"{name:14} {'PASS' if status == 'PASSED' else 'FAIL'}  {elapsed}")

    print("\nLint + sanity tests passed. Run the full suite before committing.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
