#!/usr/bin/env python3
"""Run the production build (`tsc` + `vite build`) and check the bundle budget.

Large single chunks are what makes this app slow to start on the old machine
that runs it, so the build step also fails when an **application** chunk grows
past `BUNDLE_CHUNK_BUDGET_KB`. Third-party engines (`vendor-*.js`, declared in
`vite.config.ts`) are reported but not budgeted: their size is not something app
code can fix, and worker bundles (`*.worker-*.js`) inline those engines because
workers cannot share chunks with the main graph. Both are printed for visibility.

Every Node/npm invocation goes through a Python wrapper in this repository.
"""

import shutil
import subprocess
import sys
from pathlib import Path


BUNDLE_CHUNK_BUDGET_KB = 400


def largest_chunk(dist_dir: Path) -> tuple[str, float]:
    """Returns (name, size in KB) of the biggest emitted application JS chunk."""
    assets = dist_dir / "assets"
    if not assets.exists():
        return ("", 0.0)

    chunks = [
        (path.name, path.stat().st_size / 1024)
        for path in assets.glob("*.js")
        if not path.name.startswith("vendor-") and ".worker-" not in path.name
    ]
    if not chunks:
        return ("", 0.0)
    return max(chunks, key=lambda chunk: chunk[1])


def unbudgeted_chunks(dist_dir: Path) -> list[tuple[str, float]]:
    """Vendor chunks and worker bundles, which the budget does not cover."""
    assets = dist_dir / "assets"
    if not assets.exists():
        return []
    return sorted(
        (
            (path.name, path.stat().st_size / 1024)
            for path in assets.glob("*.js")
            if path.name.startswith("vendor-") or ".worker-" in path.name
        ),
        key=lambda chunk: chunk[1],
        reverse=True,
    )


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    npm = shutil.which("npm") or "npm"
    print("Running production build...")
    result = subprocess.run([npm, "run", "build"], cwd=repo_root)
    if result.returncode != 0:
        return result.returncode

    name, size_kb = largest_chunk(repo_root / "dist")
    print(f"Largest app chunk: {name} ({size_kb:.1f} kB), budget {BUNDLE_CHUNK_BUDGET_KB} kB")
    for other_name, other_kb in unbudgeted_chunks(repo_root / "dist"):
        print(f"Not budgeted (vendor/worker): {other_name} ({other_kb:.1f} kB)")
    if size_kb > BUNDLE_CHUNK_BUDGET_KB:
        print(
            f"Build passed, but {name} exceeds the {BUNDLE_CHUNK_BUDGET_KB} kB budget. "
            "Split it with a dynamic import or manualChunks before committing.",
            file=sys.stderr,
        )
        return 1

    print("Build passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
