#!/usr/bin/env python3
"""Run TypeScript lint check."""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    print("Running lint (tsc --noEmit)...")
    result = subprocess.run("npm run lint", cwd=repo_root, shell=True)
    if result.returncode == 0:
        print("Lint passed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
