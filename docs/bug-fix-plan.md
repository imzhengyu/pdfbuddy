# PDF Buddy - Bug Fix Plan

Date: 2026-09-12
Scope: `src/`, `tests/`, config. Static reading only; nothing here was confirmed
by a runtime run unless stated.

Per `AGENTS.md`, every entry below also needs a short `CR.md` entry
(description, root cause, fix, affected files) and a test under `tests/`. The
`CR.md` file was not edited as part of this review - the entries are for whoever
implements each fix.

Severity scale: **High** = visibly wrong for a normal user, **Medium** = wrong
or confusing in a common path, **Low** = edge case or latent risk.

## Status (2026-09-12)

All of B-1 through B-8 are fixed and covered by tests; the per-issue write-ups
are in `CR.md` (Issues 9-16). Summary:

| Finding | Fix |
|---------|-----|
| B-1 Organize reorder invisible | `PageThumbnails` gained `order`; `movePage()` translates page indices to positions |
| B-2 Malformed ranges dropped pages | `parsePageRangeInput()` reports errors; Split shows them |
| B-3 Export enabled with empty selection | Empty parse result is now `null` |
| B-4 Preview failures swallowed | Shown through `ErrorBanner` |
| B-5 Cache collision on shared prefix | Head + tail hashing |
| B-6 Stale document on file change | Ref keyed by file id; thumbnails reset per load |
| B-7 Wrong warning on load failure | Dedicated load-error message + disabled download |
| B-8 Implicit extension fallback | Allow-list argument is now required |

---

## B-1 (High) Organize drag-to-reorder never changes what the user sees

**Location.** `src/components/features/OrganizeView/OrganizeView.tsx:21`,
`:52-64`, `:73-88`, `:116-124`; `src/components/common/PageThumbnails/PageThumbnails.tsx`
(renders `thumbnails.map((src, index) => ...)` in DOM index order).

**What happens.** Dragging a page in Organize updates the `pageOrder` state, and
the export honours it, but the grid is rendered from the original page indices,
so the tiles never move and their "Page N" labels never change. The user drags,
sees nothing happen, and cannot tell whether the reorder was registered. Page
numbers in the deletion hint also refer to the original order while the visible
order is unchanged, which makes multi-step edits error-prone.

**Root cause.** `PageThumbnails` has no notion of an order: it maps over its
internal thumbnail array by index. `OrganizeView` passes `dragOverIndex` (a
highlight only) and keeps the new order in state that is never fed back into
rendering.

**Reproduction.** Unit: render `OrganizeView` with a 3-page mock PDF, fire
`dragStart` on tile 1 and `dragOver`/`dragEnd` on tile 3, assert the rendered
tile order. Today the order is unchanged. E2E: same flow, compare
`[data-page-index]` values before/after the drag.

**Proposed fix.** Give `PageThumbnails` an optional `order: number[]` prop; when
present, render `order.map(position => items[position])`, use the position for
the visible "Page N" label, and keep the original index for selection/drag
payloads. Organize passes its `pageOrder`. Document the two number spaces
(original page vs displayed position) in the prop docs.

**Required test.** Component test asserting the DOM order of
`[data-testid="thumbnail-item"]` follows `pageOrder` after a drag, plus an E2E
assertion that the tile order changes.

---

## B-2 (Medium) `parsePageRanges` silently drops pages from malformed input

**Location.** `src/utils/pageRangeUtils.ts:22` (`const [startStr, endStr] = trimmed.split('-')`),
reached from the Split view's Page Ranges field
(`src/components/features/SplitView/SplitView.tsx`, `getSelectedPageNumbers`).

**What happens.** `"1-3-5"` is parsed as `1-3` and page 5 vanishes;
`"5-3"` produces an empty list; both are accepted without any warning. The user
asks for pages and silently gets a different document.

**Root cause.** Only the first two dash-separated segments are destructured and
the loop assumes `start <= end`, so extra segments are ignored and inverted
ranges iterate zero times.

**Reproduction.** Unit: `parsePageRanges('1-3-5', 10)` returns `[1,2,3]`;
`parsePageRanges('5-3', 10)` returns `[]`.

**Proposed fix.** Validate each part: reject tokens with more than one dash, and
either swap or reject `start > end`. Surface the rejection as a validation
message near the range input instead of silently exporting a smaller range.

**Required test.** Unit cases for `"1-3-5"`, `"5-3"`, `"1 - 3"`, `"1-3-5, 7"`
plus a Split view test asserting the invalid input leaves Export disabled and
shows the message.

---

## B-3 (Medium) Split can enable Export with an empty selection

**Location.** `src/components/features/SplitView/SplitView.tsx` -
`getSelectedPageNumbers` and `const hasSelection = getSelectedPageNumbers() !== null`.

**What happens.** In Page Ranges mode, input that parses to nothing (for example
`"99-100"` on a 5-page PDF, or the malformed cases in B-2) returns `[]`, not
`null`. `[] !== null` is true, so "Export Selected Pages" and "Export as Images"
are enabled; clicking then does nothing visible because the service rejects an
empty range list.

**Root cause.** The empty array is treated as "a selection" because only `null`
is checked.

**Reproduction.** Unit: render the Split view in range mode, enter `"99-100"`,
assert the Export button is disabled. Today it is enabled.

**Proposed fix.** Return `null` when the parsed list is empty, and treat empty
arrays as no selection. Optionally show the hint "No pages match this range".

**Required test.** Component test asserting both export buttons stay disabled
for a range that matches nothing.

---

## B-4 (Medium) Preview failures are swallowed in the Split view

**Location.** `src/components/features/SplitView/SplitView.tsx` - `handlePreview`
`catch (err) { /* Preview failures are silently ignored ... */ }`.

**What happens.** If building the preview PDF fails (encrypted file, corrupt
page, out-of-memory), the click has no visible effect and no error is shown.

**Root cause.** The empty catch block discards the error; the view only surfaces
`useSplit().error`, which is set by the split operation, not by preview.

**Reproduction.** Unit: mock `ClientPDFService.split` to reject, click
"Preview Selected", assert an error is displayed. Today nothing appears.

**Proposed fix.** Store the preview failure in component state (or extend
`usePreview` with an error) and render it through the existing `ErrorBanner`.

**Required test.** Component test with a rejecting service mock asserting the
banner text.

---

## B-5 (Low) `pdfCache` identifies files by a 4 kB prefix

**Location.** `src/services/pdf/pdfCache.ts:20-25` (`computeContentHash`) and
`:36` (`getCacheKey`).

**What happens.** Only the first 4 kB participate in the hash, and the key is
`name_size_hash`. Two same-size PDFs sharing a 4 kB prefix collide, so a
thumbnail/preview can render the wrong document.

**Root cause.** The hash was chosen to be cheap; the doc comment claims "stronger
identity than filename/size/lastModified", but the sample is too small.

**Reproduction.** Unit: build two `File`s of equal size with identical first
4 kB and different tails, `pdfCache.set` the first, `pdfCache.get` with the
second, assert a miss. Today it hits.

**Proposed fix.** Hash size plus the first and last 4 kB, or key by the
`WeakMap`-backed identity from `getFileId` in `src/utils/fileUtils.ts`.

**Required test.** The collision case above.

---

## B-6 (Low) `PageThumbnails` keeps a parsed document across file changes

**Location.** `src/components/common/PageThumbnails/PageThumbnails.tsx` -
`pdfRef` (`useRef<any>(null)`) is read at the start of the `[file]` effect and
only written when empty.

**What happens.** If a parent swaps `file` without unmounting the component, the
effect re-runs but `pdfRef.current` is still the previous document, so the
thumbnails, page count and selection indices describe the old file.

**Root cause.** The effect keys on `file` but the cached document is not
invalidated when `file` changes.

**Reproduction.** Unit: render with file A, rerender with file B (different page
count), assert B's page count. Today A's document is reused.

**Proposed fix.** Store the owning file id next to the ref
(`pdfRef = { fileId, pdf }`) and reset it when `getFileId(file)` differs, or add
`key={getFileId(file)}` at the call sites.

**Required test.** The rerender-with-a-different-file case.

---

## B-7 (Low) Organize reports the wrong reason when the page count fails

**Location.** `src/components/features/OrganizeView/OrganizeView.tsx` -
`handleFileDropped` (`catch { setPageOrder([]) }`) and `handleOrganize`
(`if (order.length === 0) setWarning('No pages left after deletion')`).

**What happens.** If reading the page count fails, the user gets "No pages left
after deletion" when in fact nothing was ever loaded, and there is no way to
retry from the message.

**Root cause.** Both failure modes collapse into an empty `pageOrder`.

**Proposed fix.** Track a load error separately and show a load-specific message
(`CONST_ERROR_MESSAGES`), keeping the "no pages left" warning for a genuine
all-pages-deleted state.

**Required test.** Component test with a failing `getPageCount` mock.

---

## B-8 (Low) `sanitizeExtension` silently substitutes the first allowed extension

**Location.** `src/utils/sanitize.ts` - `sanitizeExtension` returns
`normalized[0]` when nothing matches.

**What happens.** This is the mechanism behind CR.md Issue 6 (ZIP/PNG downloads
renamed to `.pdf`); `downloadBlob` now passes a MIME-derived allow-list, but any
future caller that forgets to do so gets the same silent mislabelling.

**Proposed fix.** Keep the fallback but make the intent explicit - either return
the caller's requested extension when it is on a global safe list, or log/expose
the substitution (e.g. an optional `onFallback` callback) so a future bug is
visible in tests.

**Required test.** Unit case for an unknown extension asserting the documented
fallback, plus the existing downloadUtils coverage.

---

## Already closed during this review

- **CR.md Issue 3 had no test.** `tests/config/viteConfig.test.ts` now asserts
  `worker.format === 'es'` in `vite.config.ts`, closing the only logged bug that
  was missing its `tests/` coverage.
- **`validatePDF` cache leaked between tests.** Found while validating the new
  sanity check: `pdfValidation.test.ts` failed intermittently
  ("expected spy to be called 1 times, but got 0 times") because the module-level
  validation cache is keyed by name/size/lastModified and mock files created in
  the same millisecond collided. Fixed by exporting `clearValidationCache()` and
  clearing it per test (CR.md Issue 8).

---

## Not a code defect, but worth knowing

The Playwright suite is currently red on this machine: about 6 of 20 tests fail
with `browser.newContext: Target page, context or browser has been closed`, i.e.
Edge dies between tests. The failures move around between runs, the retry also
fails, and the same tests pass or fail depending on load. The suite is already
serial (`workers: 1`) with one retry and memory-lean browser flags; this looks
like resource exhaustion on a 13-year-old machine rather than a product bug. No
assertion-level failures are currently outstanding.
