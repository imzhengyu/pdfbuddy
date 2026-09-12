#!/usr/bin/env python3
"""Serve the app locally so a human can test it on http://localhost:3000.

Usage:
    python scripts/run_local_server.py              # build, then serve the production bundle
    python scripts/run_local_server.py --no-build   # serve the existing dist/ as-is
    python scripts/run_local_server.py --dev        # Vite dev server with hot reload

The default mode builds first (through `scripts/run_build.py`, so the bundle
budget is checked too) and then serves `dist/` with `vite preview` on port 3000.
That is the mode closest to what users get, and it is much lighter on this old
machine than the dev server.

Two Windows-specific details are handled here, because both have bitten this
project before:

* The port is freed first (`scripts/free-dev-port.mjs`, which scans IPv4 *and*
  TCPv6 and only kills a Node holder). Vite binds `localhost`, which on this
  machine resolves to IPv6 `::1`; another project holding `127.0.0.1:3000`
  otherwise wins or loses depending on which stack the browser picks.
* The server is started with `--host ::`, i.e. dual-stack, and both
  `http://127.0.0.1:3000/` and `http://[::1]:3000/` are probed afterwards. If a
  stack answers with something else, the script says so instead of leaving you
  staring at another project's page.

The server runs in the foreground: leave this script running while you test, and
press Ctrl+C to stop it. Everything Node-related goes through this Python
wrapper, per AGENTS.md.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

PORT = 3000
APP_MARKER = "PDF Tool"  # CONFIG_APP_CONFIG.appName, present in the served HTML
PROBE_TIMEOUT_SECONDS = 40


def probe(url: str, timeout: float = 2.0) -> tuple[bool, str]:
    """Returns (is_our_app, detail) for one loopback URL."""
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    try:
        with opener.open(url, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
    except urllib.error.URLError as error:
        return (False, f"not reachable ({error.reason})")
    except Exception as error:  # pragma: no cover - defensive
        return (False, f"not reachable ({error})")

    if APP_MARKER in body:
        return (True, "serving this app")
    return (False, "reachable, but that is a different page")


def wait_for_server(urls: list[str]) -> dict[str, tuple[bool, str]]:
    """Polls until every URL serves the app, or the timeout expires."""
    deadline = time.time() + PROBE_TIMEOUT_SECONDS
    results: dict[str, tuple[bool, str]] = {}

    while time.time() < deadline:
        results = {url: probe(url) for url in urls}
        if all(ok for ok, _ in results.values()):
            return results
        time.sleep(0.5)

    return results


def port_holders(port: int) -> str:
    """Best-effort report of who is listening on PORT, both stacks."""
    try:
        output = subprocess.run(
            ["netstat", "-ano"], capture_output=True, text=True
        ).stdout
    except Exception:  # pragma: no cover - defensive
        return "could not read netstat output"

    lines = [
        line.strip()
        for line in output.splitlines()
        if f":{port} " in line and "LISTENING" in line.upper()
    ]
    return "; ".join(lines) if lines else f"nothing is listening on {port}"


def run_step(command: list[str], cwd: Path) -> int:
    print("+ " + " ".join(command), flush=True)
    return subprocess.run(command, cwd=cwd).returncode


def main() -> int:
    # Line-buffer our own output: when this script is launched from an agent or
    # a pipe, Python buffers stdout and the verification lines would only appear
    # after the server stops.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(line_buffering=True)
        except Exception:  # pragma: no cover - older interpreters
            pass

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dev", action="store_true", help="run the Vite dev server instead")
    parser.add_argument("--no-build", action="store_true", help="skip the production build")
    parser.add_argument(
        "--port",
        type=int,
        default=PORT,
        help=(
            "port to serve on (default 3000). Use a fresh port when the browser "
            "keeps showing a cached app for the localhost origin."
        ),
    )
    args = parser.parse_args()
    port = args.port

    repo_root = Path(__file__).resolve().parent.parent
    if not (repo_root / "node_modules").exists():
        print("node_modules not found. Please run 'npm install' first.", file=sys.stderr)
        return 1

    npm = shutil.which("npm") or "npm"

    if args.dev:
        print(f"Starting the Vite dev server on http://localhost:{port} (hot reload)...")
        return run_step([npm, "run", "dev"], repo_root)

    if not args.no_build:
        print("Building the production bundle first (bundle budget is checked)...")
        if run_step([sys.executable, "scripts/run_build.py"], repo_root) != 0:
            print("Build failed; not starting the server.", file=sys.stderr)
            return 1
    elif not (repo_root / "dist" / "index.html").exists():
        print("dist/ is missing - run without --no-build first.", file=sys.stderr)
        return 1

    # Free the port on both stacks before binding, or another project's server
    # may keep the other half of `localhost` and win the browser's race.
    print(f"Freeing any Node process already holding port {port}...")
    free_env = {**os.environ, "PDF_TOOL_PORT": str(port)}
    subprocess.run(
        ["node", "scripts/free-dev-port.mjs"], cwd=repo_root, check=False, env=free_env
    )

    url_v4 = f"http://127.0.0.1:{port}/"
    url_v6 = f"http://[::1]:{port}/"

    print(f"Starting the preview server (dual-stack) on port {port}...")
    server = subprocess.Popen(
        [npm, "run", "preview", "--", "--port", str(port), "--strictPort", "--host", "::"],
        cwd=repo_root,
    )

    try:
        results = wait_for_server([url_v4, url_v6])
        for url, (ok, detail) in results.items():
            print(f"  {'OK  ' if ok else 'WARN'} {url} - {detail}")

        if all(ok for ok, _ in results.values()):
            print(f"\nOpen http://localhost:{port} in your browser. Press Ctrl+C to stop.")
            print(
                "If that still shows a different project's page, the browser is "
                "serving cached content or a service worker for that origin: hard-reload "
                "(Ctrl+Shift+R), unregister it under DevTools > Application > Service "
                f"Workers, or restart this script with --port {port + 1}."
            )
        else:
            print(
                f"\nCareful: port {port} is not fully served by this app.\n"
                f"Who holds it right now: {port_holders(port)}\n"
                "Stop the other project (or rerun this script) before testing.",
                file=sys.stderr,
            )

        return server.wait()
    except KeyboardInterrupt:
        print("\nStopping the preview server...")
        server.terminate()
        return 0


if __name__ == "__main__":
    sys.exit(main())
