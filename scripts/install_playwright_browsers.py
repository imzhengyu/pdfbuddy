#!/usr/bin/env python3
"""Install Playwright browsers (needed before E2E tests can run)."""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    print("Installing Playwright browsers...")
    result = subprocess.run("npx playwright install", cwd=repo_root, shell=True)
    if result.returncode == 0:
        print("Playwright browsers installed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
