#!/usr/bin/env python3
"""Check the browser that the E2E suite uses.

This project does **not** download Playwright browsers. `playwright.config.ts`
runs against the locally installed Microsoft Edge (`channel: 'msedge'`, since
Google Chrome is not installed on this machine), so the default mode here only
verifies that Edge is present and tells you how to run the suite.

Pass `--install` to force `playwright install` anyway; that is only useful on a
machine without Edge and is never needed here.
"""

import shutil
import subprocess
import sys
from pathlib import Path


EDGE_CANDIDATES = (
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
)


def find_edge() -> str | None:
    for candidate in EDGE_CANDIDATES:
        if Path(candidate).exists():
            return candidate
    return shutil.which("msedge")


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    if "--install" in sys.argv[1:]:
        npx = shutil.which("npx") or "npx"
        print("Installing Playwright browsers (explicitly requested)...")
        return subprocess.run([npx, "playwright", "install"], cwd=repo_root).returncode

    edge = find_edge()
    if not edge:
        print(
            "Microsoft Edge was not found. The E2E suite runs on the Edge channel "
            "(channel: 'msedge'), so install Edge or set up a different channel.",
            file=sys.stderr,
        )
        return 1

    print(f"Microsoft Edge found: {edge}")
    print("No browser download needed - run 'python scripts/run_e2e_tests.py'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
