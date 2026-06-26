#!/usr/bin/env python3
"""Run unit tests."""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    extra_args = sys.argv[1:]
    if extra_args:
        cmd = "npx vitest --run " + subprocess.list2cmdline(extra_args)
        print(f"Running unit tests with args: {' '.join(extra_args)}")
    else:
        cmd = "npx vitest --run"
        print("Running unit tests...")

    result = subprocess.run(cmd, cwd=repo_root, shell=True)
    if result.returncode == 0:
        print("Unit tests passed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
