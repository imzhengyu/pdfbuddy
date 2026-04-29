# Project CLAUDE.md

## Bug/Issue Tracking Rule

Every bug or issue found must be:
1. **Documented in CR.md** - Create/update entry in `CR.md` with bug description, fix details, and affected files
2. **Covered by a test** - Add a test item to `tests/components/` to cover the bug fix scenario

## Development Guidelines

- Follow existing test patterns in `tests/components/`
- Use `act()` and `waitFor()` from `@testing-library/react` for state updates
- Use `fireEvent` for DOM interactions in tests
- All tests must pass before considering work complete

## Webapp Shutdown Guideline

When stopping the pdf-tool webapp:
- **ONLY** kill the Vite/node process serving the app on port 3000
- **DO NOT** kill all chrome.exe processes - users may have other Chrome windows open for browsing
- Use port-based process termination (e.g., `Get-NetTCPConnection -LocalPort 3000`) to target only the specific server process

## Network/VPN Proxy Guideline

If git operations timeout (e.g., `git push`, `git pull`), configure v2ray proxy:

```bash
git config --global http.proxy http://127.0.0.1:10808
git config --global https.proxy http://127.0.0.1:10808
```

To disable when not needed:
```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## Git Commit & Push Rule

**DO NOT commit or push automatically.** Only commit and push when explicitly commanded by the user. If work is ready to be saved, inform the user and wait for their explicit instruction to commit and push.