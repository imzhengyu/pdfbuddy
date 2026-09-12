# AGENTS.md

Guidance for Codex and other agents working in this repository.

## Project Overview

**PDF Buddy** - a client-side PDF toolkit web app. All processing happens in the
browser; user files never leave the device.

Five features, each a lazy-loaded view: Merge, Split, Rotate, Convert
(images -> PDF), Organize.

- **Stack:** React 18 + TypeScript, Vite 5, CSS Modules + CSS custom properties
- **PDF engines:** `pdf-lib` (primary), `pdfjs-dist` (thumbnails/rendering),
  `pdfkit` (fallback scaffold - browser PDF loading support is limited)
- **State:** one `AppContext` for view routing, theme, and recent files;
  per-feature hooks for everything else
- **Tests:** Vitest + React Testing Library (unit/component), Playwright (E2E, Chromium)

## Commands

**Never invoke `node`, `npm` or `npx` directly.** Every Node invocation goes
through the Python wrappers in `scripts/`, which print a pass/fail summary:

| Task | Command |
|------|---------|
| Type-check / lint | `python scripts/run_lint.py` |
| **After every change: lint + critical sanity tests** | `python scripts/run_sanity.py` |
| Critical sanity tests alone | `python scripts/run_unit_tests.py --sanity` |
| Unit tests | `python scripts/run_unit_tests.py` (extra args are forwarded to Vitest) |
| E2E (Playwright) | `python scripts/run_e2e_tests.py` - **commit time only**, see Testing |
| Production build | `python scripts/run_build.py` |
| Serve locally for manual testing | `python scripts/run_local_server.py` (`--dev` for hot reload, `--no-build` to skip the build) |
| Everything: lint -> unit -> build -> e2e | `python scripts/run_regression.py` |
| Check the E2E browser | `python scripts/install_playwright_browsers.py` (verifies Edge; no download) |

The wrappers call the npm scripts under the hood (`npm run lint`,
`npx vitest run`, `npm run test:e2e`, `npm run build`); those npm scripts stay
the contract for CI and the pre-commit hook. The interactive dev server
(`npm run dev`, port 3000) is started automatically by the E2E wrapper when one
is not already running.

The Windows sandbox blocks Node's own child-process creation, so these wrappers
may need to run with approval outside the sandbox - that is expected, and it is
the reason the wrappers exist.

## Architecture

```
src/
  App.tsx                  # view routing (lazy) + header/footer
  context/AppContext.tsx   # view, theme, recent files
  config/constants.ts      # every tunable, exported as CONST_* objects
  components/
    common/                # Button, DropZone, FileList, PageThumbnails, PreviewModal, ...
    features/<Name>View/   # one folder per feature
  hooks/                   # usePDFOperation factory + per-feature hooks
  services/pdf/            # ClientPDFService + one module per operation
  workers/                 # pdfProcessor.worker.ts + workerTypes.ts
  utils/                   # download, error, file, sanitize, retry, performance
```

Conventions that matter when editing:

- New PDF work belongs in `src/services/pdf/<operation>Operation.ts` and is
  re-exported from `src/services/pdf/index.ts`.
- UI reads tunables from the `CONST_*` objects in `src/config/constants.ts`.
  Do not hardcode sizes, timeouts, MIME types, or error strings.
- Client-side work is bounded: `CONST_LIMITS_CONFIG` caps pages per document,
  thumbnail pages, image-export pages and files per operation (see CR.md Issue
  19). Never add an unbounded loop over pages or files - check the limit and
  show the matching `CONST_ERROR_MESSAGES` text instead.
- CSS values come from custom properties in `src/styles/variables.css`.
  Breakpoints are 480 / 768 / 1024 px.
- **No CDN dependencies.** Use locally installed npm packages. The one accepted
  exception is the `pdfjs-dist` worker URL, used only where no local option exists.

## Working Agreements

### Bug / issue tracking (required)

Every bug or issue found must:

1. Be documented in `CR.md` at the repository root - description, root cause,
   fix, and affected files.
2. Be covered by a test under `tests/`.

`docs/CHANGELOG.md` is the longer, phase-by-phase record of completed work.
Keep the root `CR.md` as the short, append-only issue log, and do not duplicate
entries between the two.

### Testing

- **Sanity check after every change; the full suite at commit time.**
  `python scripts/run_sanity.py` runs lint plus a curated set of critical test
  files (PDF pipeline, range/download/file utilities, config contract, feature
  hooks, thumbnails, preview modal, Split and Organize views) in about fifteen
  seconds - use it after each edit instead of the whole suite. Run the full unit suite
  (`python scripts/run_unit_tests.py`) plus `python scripts/run_e2e_tests.py`
  when the user asks to commit; that is what the pre-commit hook (`npm test`)
  enforces as well. Keep the sanity list in `scripts/run_unit_tests.py` focused;
  the script fails loudly if a listed file disappears.
- Follow the existing patterns in `tests/components/`.
- Use `act()` and `waitFor()` from `@testing-library/react` for state updates,
  and `fireEvent` for DOM interactions.
- Shared helpers live in `tests/utils/testHelpers.ts`
  (e.g. `uploadFileToDropzone`, `createMockFile`, `waitForCondition`).
- **Cap unit-test concurrency.** `vitest.config.ts` pins `maxWorkers: 3`, and
  `scripts/run_unit_tests.py` enforces the same cap by passing
  `--maxWorkers=3 --minWorkers=1`, so at most three test files run at once and
  the next file starts as soon as a worker frees up. Every file spins up its own
  jsdom environment, and this is a 13-year-old machine, so Vitest's default (one
  worker per core) saturates it and the box becomes unresponsive. Keep the limit
  in the 3-5 range; never raise it to "use all cores".
- **E2E is a commit-time check, not a per-change check.** Do not run
  `python scripts/run_e2e_tests.py` after ordinary edits: it takes several
  minutes and loads this old machine heavily. Run it (together with the full
  unit suite) when the user asks to commit, or when the user asks for it.
- **Run E2E serially - always.** This machine is old and low on resources, and
  several parallel browser instances crash it, which shows up as
  `Target page, context or browser has been closed` failures that look like real
  test failures but are not. `playwright.config.ts` pins `workers: 1` and
  `fullyParallel: false`, and `scripts/run_e2e_tests.py` injects `--workers=1`
  while stripping any parallelism flags a caller passes, so the serial default
  does not depend on the operator remembering it. Do not raise either value.
  The wrapper also applies `--retries=1`: Edge occasionally dies between tests
  on this machine (`browser.newContext: Target page, context or browser has been
  closed`), and a retry relaunches it instead of reporting a phantom failure.
- E2E never downloads browsers. It runs against the locally installed Microsoft
  Edge via `channel: 'msedge'` (Google Chrome is not installed on this machine),
  and reuses an already-running dev/preview server when one is up.
- On this hardware, a full E2E run takes several minutes. That is expected.
- All tests must pass before work is considered complete.

### Git

- **Do not commit or push automatically.** Only commit and push when explicitly
  asked. When work is ready to save, say so and wait for instructions.
- A pre-commit hook runs `npm test` (lint + one-shot unit tests).
- If git operations time out, the maintainer enables a local v2ray proxy:
  `git config --global http.proxy http://127.0.0.1:10808`
  (and `--unset` both `http.proxy` / `https.proxy` when done).

## Environment Notes (Windows)

Tool paths, if the shell `PATH` is not already configured: Git
`C:\Program Files\Git\cmd`, Node/npm `C:\Program Files\nodejs`.

### Network / proxy (China)

This machine is in mainland China. Direct outbound requests to `openai.com`,
`developers.openai.com`, `learn.chatgpt.com`, and sometimes `github.com` are
blocked or filtered, so a plain fetch fails with `Forbidden` or a timeout.

A local VPN proxy is running at **http://127.0.0.1:7890**. Use it explicitly for
anything that needs to reach the public internet:

- `Invoke-WebRequest` / `Invoke-RestMethod`: add `-Proxy http://127.0.0.1:7890`.
- Tools that read env vars: set `HTTPS_PROXY` / `HTTP_PROXY` to
  `http://127.0.0.1:7890` for that command only.
- `git`: `git config --global http.proxy http://127.0.0.1:7890`, then
  `git config --global --unset http.proxy` (and `https.proxy`) when done.

Confirm the proxy is listening before blaming the network:

```powershell
Get-NetTCPConnection -LocalPort 7890 -State Listen
```

The official Codex docs host is `learn.chatgpt.com`; any page has a Markdown
twin at `<page-url>.md`. The proxy is the only path out, and it is reachable from
inside the sandbox (localhost connections are allowed), so no escalation is
needed for a proxied fetch. The v2ray proxy on port 10808 mentioned in the Git
section below is an older note - prefer 7890.

### Shell: use PowerShell 7 from Program Files, never cmd.exe by choice

The Windows sandbox launches the shell for every command. On this machine that
shell is the properly installed PowerShell 7:

```
C:\Program Files\PowerShell\7\pwsh.exe
```

Do **not** point Codex at any other PowerShell. Specifically:

- No Microsoft Store / MSIX build (`C:\Program Files\WindowsApps\Microsoft.PowerShell_*`
  or the `%LOCALAPPDATA%\Microsoft\WindowsApps\pwsh.exe` alias). The sandbox
  spawns the shell inside a restricted token, and launching an MSIX-packaged
  `pwsh.exe` from that context intermittently fails with
  `CreateProcessAsUserW failed: 5 (access denied)`, which surfaces as random
  command failures rather than a clear error.
- No locally unzipped copy on `PATH` - Codex checks the Program Files path
  first, and a second `pwsh.exe` only makes the resolved shell ambiguous.

The Store build and a previously unzipped copy were both removed for these
reasons; the current install is the MSI-backed one above.

Use `cmd.exe` only as a genuine last resort. Windows `cmd` mangles quoting in ways
that produce silently wrong results rather than errors, and it has repeatedly cost
real time in this repository:

- `tasklist /FI "IMAGENAME eq node.exe"` loses its quotes and fails with
  `Invalid argument/option - 'eq'`.
- `findstr /c:"..."` and `rg -F "..."` failed to match strings that were verifiably
  present in the file, while the same search through PowerShell `Select-String` worked.
- Multi-line scripts and `|` / `&` / `>` chains are brittle and hard to review.

Practical guidance:

- Prefer `Select-String`, `Get-Content`, `Set-Content`, `Get-ChildItem`, `Test-Path`,
  `Copy-Item`, and `Remove-Item -LiteralPath` over `findstr`, `type`, `dir`, `del`,
  and shell redirection.
- Use `Get-NetTCPConnection` and `Get-Process` for port and process work.
- If a command fails with `CreateProcessAsUserW failed` or another sandbox launch
  error, report it instead of falling back to `cmd.exe`.

### Stopping the dev server

`scripts/free-dev-port.mjs` runs automatically before `dev` and the test scripts.
It only touches TCP port 3000, and only when the process holding it is Node; an
unrelated process is reported and left alone.

To stop the server by hand, kill **only** the process bound to port 3000. Do not
kill all `node.exe` or `chrome.exe` processes - other windows may be unrelated.

## Known Gaps / TODO

- `OrganizeView`: drag-to-reorder pages is still a TODO (page deletion works).
- Cross-browser (Firefox/Safari), mobile responsiveness, and a clean production
  console are unverified in `docs/SPEC.md`.
- `pdfkit` fallback is scaffold-only; it cannot reliably load existing PDFs in
  the browser.
