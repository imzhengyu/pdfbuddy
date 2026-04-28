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