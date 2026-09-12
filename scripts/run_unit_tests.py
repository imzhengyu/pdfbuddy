#!/usr/bin/env python3
"""Run the Vitest unit/component suite (`vitest run`).

The worker count is capped here (3 files at a time) because every test file
spins up its own jsdom environment and this machine is old - Vitest's default
(one worker per core) saturates it and the box stops responding. The cap is
applied by this script so it cannot be forgotten.

Usage:
    python scripts/run_unit_tests.py                 # whole suite
    python scripts/run_unit_tests.py --sanity        # critical tests only (per-change check)
    python scripts/run_unit_tests.py tests/utils     # one folder
    python scripts/run_unit_tests.py -t "keeps .zip" # one test name

`--sanity` is the check to run after every code change: it covers the PDF
pipeline, the range/download/file utilities, the config contract, the feature
hooks and the two most intricate views, and finishes in a fraction of the full
suite. Run the whole suite (or `python scripts/run_regression.py`) when the user
asks to commit - that is also what the pre-commit hook does.

Every Node/npm invocation goes through a Python wrapper in this repository.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


MAX_WORKERS = 3
MIN_WORKERS = 1

# Critical-path tests for the per-change sanity check. Keep this list focused:
# one entry per contract that, if broken, makes the app wrong for users. Every
# path must exist - the script fails loudly if the list goes stale.
SANITY_TEST_FILES = [
    "tests/config/constants.test.ts",
    "tests/utils/pageRangeUtils.test.ts",
    "tests/utils/downloadUtils.test.ts",
    "tests/utils/sanitize.test.ts",
    "tests/utils/fileUtils.test.ts",
    "tests/services/pdfValidation.test.ts",
    "tests/services/mergeOperation.test.ts",
    "tests/services/splitOperation.test.ts",
    "tests/services/rotateOperation.test.ts",
    "tests/services/reorganizeOperation.test.ts",
    "tests/services/convertOperation.test.ts",
    "tests/services/pdfCache.test.ts",
    "tests/hooks/featureHooks.test.ts",
    "tests/components/PageThumbnails.test.tsx",
    "tests/components/PreviewModal.test.tsx",
    "tests/components/MergeView.test.tsx",
    "tests/components/SplitView.test.tsx",
    "tests/components/OrganizeView.test.tsx",
]


def missing_sanity_files(repo_root: Path) -> list[str]:
    return [f for f in SANITY_TEST_FILES if not (repo_root / f).exists()]


def strip_worker_flags(args: list[str]) -> list[str]:
    """Drop caller-supplied worker flags so the cap below always applies."""
    kept: list[str] = []
    skip_next = False
    for arg in args:
        if skip_next:
            skip_next = False
            continue
        if arg in ("--maxWorkers", "--minWorkers", "--max-workers", "--min-workers"):
            skip_next = True
            continue
        if arg.startswith(("--maxWorkers=", "--minWorkers=", "--max-workers=", "--min-workers=")):
            continue
        kept.append(arg)
    return kept


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    npx = shutil.which("npx") or "npx"
    extra_args = strip_worker_flags(sys.argv[1:])

    sanity = "--sanity" in extra_args
    if sanity:
        extra_args = [a for a in extra_args if a != "--sanity"]
        if extra_args:
            print("--sanity ignores extra arguments; running the critical set.", file=sys.stderr)
            extra_args = []

        missing = missing_sanity_files(repo_root)
        if missing:
            print(
                "sanity list is stale, these files no longer exist: " + ", ".join(missing),
                file=sys.stderr,
            )
            return 1

    if sanity:
        workers = 2
        cmd = [npx, "vitest", "run"] + SANITY_TEST_FILES
        print(f"Running {len(SANITY_TEST_FILES)} critical test files (sanity check)...")
    elif extra_args:
        workers = MAX_WORKERS
        cmd = [npx, "vitest", "run"] + extra_args
        print(f"Running unit tests with args: {' '.join(extra_args)}")
    else:
        workers = MAX_WORKERS
        cmd = [npx, "vitest", "run"]
        print("Running unit tests...")

    worker_args = [f"--maxWorkers={workers}", f"--minWorkers={MIN_WORKERS}"]
    cmd += worker_args

    if sanity:
        print("Sanity check only - run the full suite before committing.")
    else:
        print(f"Capped at {workers} workers (this machine cannot handle more).")

    result = subprocess.run(cmd, cwd=repo_root)
    if result.returncode == 0:
        print("Sanity tests passed." if sanity else "Unit tests passed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
