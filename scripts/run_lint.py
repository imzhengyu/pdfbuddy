#!/usr/bin/env python3
"""Run the TypeScript type check (`npm run lint`, i.e. `tsc --noEmit`).

Every Node/npm invocation in this repository goes through a Python wrapper so
there is a single, auditable entry point (and so the run can be lifted out of
the Windows sandbox, which blocks Node's own child-process creation).
"""

import shutil
import subprocess
import sys
from pathlib import Path


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    npm = shutil.which("npm") or "npm"
    print("Running lint (tsc --noEmit)...")
    result = subprocess.run([npm, "run", "lint"], cwd=repo_root)
    if result.returncode == 0:
        print("Lint passed.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
