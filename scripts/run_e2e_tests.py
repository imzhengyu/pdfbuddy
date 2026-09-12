#!/usr/bin/env python3
"""Run the Playwright E2E suite.

Usage:
    python scripts/run_e2e_tests.py                      # whole suite, Edge, serial
    python scripts/run_e2e_tests.py tests/e2e/app.spec.ts
    python scripts/run_e2e_tests.py --last-failed

The suite always runs serially (`--workers=1`): parallel browser instances
crash this machine and show up as bogus "target page has been closed" failures.
It uses the locally installed Microsoft Edge (`channel: 'msedge'`) and never
downloads browsers. The serial default is applied here, so it does not depend on
whoever runs the suite remembering it; `playwright.config.ts` pins the same
values (`workers: 1`, `fullyParallel: false`). Every Node/npm invocation goes
through a Python wrapper.

One retry is applied by default as well: on this 13-year-old machine Edge
occasionally dies between tests (`browser.newContext: Target page, context or
browser has been closed`), and a retry re-launches it instead of reporting a
failure that has nothing to do with the code under test.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


MAX_WORKERS = 1
RETRIES = 1


def strip_parallel_flags(args: list[str]) -> list[str]:
    """Drop caller-supplied parallelism/retry flags so the defaults always apply."""
    kept: list[str] = []
    skip_next = False
    for arg in args:
        if skip_next:
            skip_next = False
            continue
        if arg in ("--workers", "-j", "--retries"):
            skip_next = True
            continue
        if (
            arg.startswith(("--workers=", "-j", "--retries="))
            or arg.startswith("--fully-parallel")
        ):
            continue
        kept.append(arg)
    return kept


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    npm = shutil.which("npm") or "npm"
    extra_args = strip_parallel_flags(sys.argv[1:])
    worker_args = [f"--workers={MAX_WORKERS}", f"--retries={RETRIES}"]

    if extra_args:
        # Forward extra args to playwright (npm passes args after --)
        print(f"Running E2E tests with args: {' '.join(extra_args)}")
        cmd = [npm, "run", "test:e2e", "--"] + extra_args + worker_args
    else:
        print("Running E2E tests...")
        cmd = [npm, "run", "test:e2e", "--"] + worker_args

    print(
        "Running one browser at a time (this machine cannot handle parallel "
        f"browsers); up to {RETRIES} retry per failing test for browser crashes."
    )

    result = subprocess.run(cmd, cwd=repo_root)
    if result.returncode == 0:
        print("E2E tests passed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
