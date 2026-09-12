# Code Review / Issue Log

## Issue 1: PreviewModal module-level image cache leaked across tests

**Description**
`PreviewModal` kept a module-level `pageImageCache` that was not cleared between tests. Because the same `File` instance was reused across tests, cached images from earlier tests caused the "does not re-render cached pages when reopening the same file" test to see zero `getPage` calls on initial load and fail.

**Fix**
- Exported `clearPreviewImageCache()` from `src/components/common/PreviewModal/PreviewModal.tsx`.
- Updated `tests/components/PreviewModal.test.tsx` to call `clearPreviewImageCache()` in `beforeEach`.

**Affected files**
- `src/components/common/PreviewModal/PreviewModal.tsx`
- `tests/components/PreviewModal.test.tsx`

## Issue 2: PageThumbnails error test produced unhandled rejection

**Description**
The "handles error when loading PDF fails" test returned `Promise.reject(new Error(...))` from the `getDocument` mock. The rejected promise was created before the component attached a handler, causing Vitest to report an unhandled rejection and exit with code 1.

**Fix**
Changed the mock to use a getter so the rejected promise is created when the component accesses `loadingTask.promise`, ensuring the handler is attached immediately.

**Affected files**
- `tests/components/PageThumbnails.test.tsx`

## Issue 3: Vite worker bundle failed after adding convertToImages worker route

**Description**
Adding a `new Worker(...)` reference inside `src/services/pdf/convertOperation.ts` caused Vite to bundle `pdfProcessor.worker.ts` with the default `iife` format, which does not support code-splitting. The build failed with "Invalid value 'iife' for option 'output.format'".

**Fix**
- Extracted `convertImagesToPdf` and its types into `src/services/pdf/convertImagesToPdf.ts` to break the worker/service circular dependency.
- Set `worker.format: 'es'` in `vite.config.ts` so module workers are bundled as ES modules.

**Affected files**
- `src/services/pdf/convertOperation.ts`
- `src/services/pdf/convertImagesToPdf.ts`
- `src/workers/pdfProcessor.worker.ts`
- `vite.config.ts`

## Issue 4: Dev-port helper missed IPv6-only listeners

**Description**
`scripts/free-dev-port.mjs` scanned with `netstat -ano -p tcp`. The `-p tcp` flag restricts
output to IPv4 sockets, so a Vite process bound to IPv6 loopback (`::1`) was invisible to the
scan. The helper reported `[free-dev-port] port 3000 is free` while the port was still held,
so the stale server was never stopped.

**Fix**
- Scan with `netstat -ano` (no `-p tcp`), which lists both IPv4 and TCPv6 rows.
- Extracted parsing into an exported `parseListeningPids(output, port)` function so it can be
  unit tested, and guarded the script body behind a direct-invocation check so importing it
  has no side effects.

**Affected files**
- `scripts/free-dev-port.mjs`
- `tests/scripts/freeDevPort.test.ts`

## Issue 5: Living docs still advertised the removed Compress feature

**Description**
The Compress feature (view, hook, and `compressOperation`) was removed and the
`View` union dropped to five entries, but several living docs and the manual
verification script still referenced it:

- `README.md` still had a "### Compress PDF" feature section.
- `docs/SPEC.md` still listed `CompressView`, `compressOperation.ts`, and
  `useCompress.ts` in the file-structure tree, and still claimed "All 6 features".
- `docs/implementation.md` still listed `useCompress` in the hooks overview and
  claimed "All 6 hooks/views/features".
- `docs/testplan.md` still numbered Rotate/Convert/Organize as sections 4/5/6,
  leaving a gap where the Compress section used to be.
- `scripts/verify-functions.mjs` still ran a `Compress` navigation test against
  a button that no longer exists.

**Root cause**
The feature removal was applied to `src/` and the test suite, but the
documentation sweep was only partially completed before the session ended, so
the remaining references were never updated.

**Fix**
- Removed the Compress section from `README.md`.
- Removed the Compress file-tree entries and corrected the feature/hook/view
  counts to five in `docs/SPEC.md` and `docs/implementation.md`.
- Renumbered `docs/testplan.md` sections 4/5/6 to 3/4/5.
- Dropped the Compress case from `scripts/verify-functions.mjs` and renumbered
  the remaining tests.
- Added `tests/docs/featureDocs.test.ts`, which fails if any living doc or the
  verification script mentions the removed feature, and asserts the README
  documents every view in the app's `View` union.

**Affected files**
- `README.md`
- `docs/SPEC.md`
- `docs/implementation.md`
- `docs/testplan.md`
- `scripts/verify-functions.mjs`
- `tests/docs/featureDocs.test.ts` (new)

## Issue 6: Split exports were misnamed - ZIP and image downloads came out as `.pdf`

**Description**
Splitting a PDF with more than one page selected exports a ZIP archive, but the
downloaded file was named `<name>_selected.pdf`. The same happened to
`Export as Images`, which produced `.pdf`-named PNGs (and a `.pdf`-named
`_images.zip`). The bytes inside were correct; only the filename was wrong, so
the browser also saved it with the wrong association. Playwright caught this in
`PDF Split E2E > Page ranges mode - export specific range`, which expected
`/.*\.zip$/i` and received `split-source_selected.pdf`.

**Root cause**
`downloadBlob` always sanitized the extension against
`CONST_PDF_CONFIG.supportedExtensions` (`['.pdf']`). `sanitizeExtension` returns
`allowedExtensions[0]` for any extension that is not on the list, so every ZIP
and PNG filename was rewritten to end in `.pdf` before the anchor was clicked.
No test covered `downloadUtils`, so the mislabelling went unnoticed.

**Fix**
- `CONST_MIME_TYPES` gained `zip: 'application/zip'`.
- `CONST_DOWNLOAD_CONFIG` gained `extensionsByMimeType` (pdf -> `.pdf`,
  zip -> `.zip`, png -> `.png`, jpeg -> `.jpg`/`.jpeg`), `safeExtensions`, and
  `fallbackExtensions`.
- `downloadBlob` now resolves the allowed extensions from the blob's MIME type
  first (`resolveAllowedExtensions`), then from the requested extension when it
  is a known-safe one, and only falls back to `.pdf` when neither is usable.
  Filename sanitization and the `isValidFilename` guard are unchanged.

**Affected files**
- `src/config/constants.ts`
- `src/utils/downloadUtils.ts`
- `tests/utils/downloadUtils.test.ts` (new)

## Issue 7: Blob URLs were revoked in the same tick as the download click

**Description**
Every E2E run failed the same six tests, and the failures always landed on the
test that followed one which downloaded a file (Merge > "Remove file from list",
Split > "Select multiple pages and export as ZIP", Rotate > "Preview rotated PDF
opens modal", Convert > "Convert multiple images", Organize > "Delete one page
and download the organized PDF"). The error was always
`browser.newContext: Target page, context or browser has been closed`, i.e. Edge
was gone before the next test started. Retries and memory-lean launch flags did
not help. The same pattern can abort a real user download of a large PDF.

**Root cause**
`downloadBlob` revoked the object URL in a `finally` block immediately after
`link.click()`. The browser reads the blob asynchronously once the download
starts, so revoking the URL in the same tick can cancel or corrupt the transfer
and leaves the headless browser process unusable for the next test.

**Fix**
- Added `CONST_DOWNLOAD_CONFIG.urlRevokeDelayMs` (10s) and deferred the revoke
  with `window.setTimeout`, so the browser has time to start reading the blob.
- Added a regression test asserting the URL is not revoked synchronously and is
  revoked once the delay elapses.

**Affected files**
- `src/config/constants.ts`
- `src/utils/downloadUtils.ts`
- `tests/utils/downloadUtils.test.ts`

## Issue 8: `validatePDF` cache leaked between tests

**Description**
`tests/services/pdfValidation.test.ts > validatePDF cache > validatePDF with
level full uses cached result` failed intermittently (once in a full run, once
in a sanity run) with `expected "spy" to be called 1 times, but got 0 times`,
while passing on its own.

**Root cause**
`src/services/pdf/pdfValidation.ts` keeps a module-level `validationCache`
keyed by file name/size/lastModified. The tests build mock files with the same
name and size, so when two of them were created within the same millisecond
their keys collided and the second test's first call hit the cache populated by
an earlier test - making the `PDFDocument.load` call count depend on timing.

**Fix**
- Exported `clearValidationCache()` from `src/services/pdf/pdfValidation.ts`
  (same testability pattern as `clearPreviewImageCache` in `PreviewModal`).
- `tests/services/pdfValidation.test.ts` clears the cache in the cache
  describe's `beforeEach`, so each case starts from a known state.

**Affected files**
- `src/services/pdf/pdfValidation.ts`
- `tests/services/pdfValidation.test.ts`

## Issue 9: Organize's drag-to-reorder was invisible

**Description**
Dragging a page in `OrganizeView` updated the export order but the grid never
moved: the tiles kept their original positions and "Page N" labels, so the user
could not tell whether the drag registered.

**Root cause**
`PageThumbnails` always rendered its pages in document order and had no notion of
an order prop; `OrganizeView` kept the new order in state that was only used at
export time. The drag handlers also report original page indices while the order
array is indexed by position, so a naive splice corrupted the order.

**Fix**
- `PageThumbnails` accepts `order?: number[]`, renders in that order, and labels
  tiles by on-screen position (`data-page-position`) while `data-page-index`
  keeps the original page for selection and drag payloads.
- `OrganizeView` passes `pageOrder` and moves pages through the new exported
  `movePage()` helper, which translates page indices to positions.

**Affected files**
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `src/components/features/OrganizeView/OrganizeView.tsx`
- `tests/components/PageThumbnails.test.tsx`
- `tests/components/OrganizeView.test.tsx`

## Issue 10: Page ranges silently dropped pages

**Description**
`"1-3-5"` was parsed as `1-3` (page 5 vanished), `"5-3"` selected nothing, and
pages beyond the document were ignored - all without any message, so the
exported file could differ from what the user asked for.

**Root cause**
`parsePageRanges` destructured `trimmed.split('-')` into exactly two names and
looped from `start` to `end`, so extra segments were ignored and backwards
ranges iterated zero times. Invalid input produced no signal to the caller.

**Fix**
- Added `parsePageRangeInput()` returning `{ pages, errors }`; it rejects
  multi-dash tokens, backwards ranges and non-numeric parts, and reports pages
  beyond the known page count. `parsePageRanges()` remains as a thin wrapper.
- The Split view shows the messages (`role="alert"`) next to the range input.

**Affected files**
- `src/utils/pageRangeUtils.ts`
- `src/components/features/SplitView/SplitView.tsx`
- `src/components/features/SplitView/SplitView.module.css`
- `tests/utils/pageRangeUtils.test.ts`
- `tests/components/SplitView.test.tsx`

## Issue 11: Split enabled export with an empty selection

**Description**
In Page Ranges mode, an input that matched no pages (for example `99-100` on a
5-page document) left "Export Selected Pages" and "Export as Images" enabled.
Clicking them did nothing, because the empty list was rejected further down.

**Root cause**
`getSelectedPageNumbers()` returned the parsed array even when it was empty, and
the view only treated `null` as "no selection".

**Fix**
Return `null` when the parsed range is empty, so both buttons stay disabled.

**Affected files**
- `src/components/features/SplitView/SplitView.tsx`
- `tests/components/SplitView.test.tsx`

## Issue 12: Split preview failures were swallowed

**Description**
If building the preview PDF failed (encrypted file, corrupt page), nothing was
shown: the catch block was empty and the click appeared to do nothing.

**Root cause**
`handlePreview` discarded the error; only the split operation's error was wired
to the `ErrorBanner`.

**Fix**
Store the failure in component state and render it through `ErrorBanner`.

**Affected files**
- `src/components/features/SplitView/SplitView.tsx`
- `src/config/constants.ts`
- `tests/components/SplitView.test.tsx`

## Issue 13: The PDF cache could serve the wrong document

**Description**
`pdfCache` keyed entries by name, size and a hash of the file's first 4 kB, so
two same-size PDFs sharing a prefix collided and the cache could hand back the
wrong parsed document for thumbnails or preview.

**Root cause**
The content sample was too small to distinguish files.

**Fix**
Hash the head *and* the tail of the file
(`CONST_CACHE_CONFIG.contentHashSampleSize`), keeping the existing key shape.

**Affected files**
- `src/services/pdf/pdfCache.ts`
- `src/config/constants.ts`
- `tests/services/pdfCache.test.ts`

## Issue 14: PageThumbnails reused the previous file's document

**Description**
When the `file` prop changed without the component unmounting, the grid could
render the previous document's pages and page count.

**Root cause**
The parsed document was cached in a ref that was only consulted for emptiness;
the effect keyed on `file` but never invalidated the ref.

**Fix**
Store `{ fileId, pdf }` in the ref and ignore it when the id differs; also reset
the thumbnail array at the start of each load.

**Affected files**
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `tests/components/PageThumbnails.test.tsx`

## Issue 15: Organize blamed page deletion when the file could not be read

**Description**
If reading the page count failed, clicking "Download Organized PDF" warned
"No pages left after deletion", which described the wrong problem and offered no
way forward.

**Root cause**
Both a failed load and an all-pages-deleted document collapse into an empty
`pageOrder`.

**Fix**
Track a load error separately (`CONST_ERROR_MESSAGES.pageCountFailed`), show it in
an `ErrorBanner`, and disable the download button while it is set.

**Affected files**
- `src/components/features/OrganizeView/OrganizeView.tsx`
- `src/config/constants.ts`
- `tests/components/OrganizeView.test.tsx`

## Issue 16: `sanitizeExtension` hid extension substitutions

**Description**
`sanitizeExtension` fell back to the first allowed extension whenever the
requested one was not in the list. That is how ZIP and PNG exports shipped as
".pdf" (Issue 6), and any future caller could reintroduce it by forgetting the
allow-list argument.

**Root cause**
The allow-list parameter had a default, so the substitution was implicit.

**Fix**
- The allow-list is now required, so every call site must state which extensions
  are safe for the payload it is writing.
- Documented the fallback in the JSDoc and pinned it with tests (`.zip`, `.jpg`
  and an unknown extension falling back to the first allowed one).

**Affected files**
- `src/utils/sanitize.ts`
- `tests/utils/sanitize.test.ts`

## Issue 17: Merge preview ignored the file order

**Description**
On the Merge page, loading PDFs and clicking "Preview Files" showed the first
file only. Reordering the list afterwards did not change what the preview
showed - and because a separate effect closed the modal whenever the file list
changed, the preview simply disappeared instead of following the new order.

**Root cause**
`handlePreview` deliberately opened `files[0]` ("Lightweight preview: just show
the first file instead of merging all files"), so the preview carried no order
information at all, and `useEffect(() => closePreview(), [files])` dismissed the
modal on every reorder, add or remove.

**Fix**
- The preview is now the *merged* document built from the current file list, so
  it matches what "Merge N Files" will download.
- An effect rebuilds the preview whenever the list changes while the modal is
  open (signature = file ids in order), keeping the modal open and the order
  current; an empty list closes it.
- `merge()` is read through a ref so the hook's unstable function identity does
  not make the sync effect loop.

**Affected files**
- `src/components/features/MergeView/MergeView.tsx`
- `tests/components/MergeView.test.tsx`

## Issue 18: "Export as Images" rasterised every page, ignoring the selection

**Description**
On the Split page, selecting two pages and clicking "Export as Images" produced
images for the whole document, named `page_1.png`, `page_2.png`, ... rather than
the selected pages. The selection was only used to name the single-page case, so
the output was both wrong and much more expensive than necessary.

**Root cause**
`SplitView.handleExportAsImages` called `service.convertToImages(file, { format,
scale })` without passing the pages, and `ConvertToImagesOptions` had no way to
express a page subset: both the main-thread and worker implementations always
rendered `1..numPages` and returned images indexed by absolute page number.

**Fix**
- `ConvertToImagesOptions` gained `pages?: number[]` (1-based); pages are
  de-duplicated, clamped to the document and rendered in ascending order, while
  an empty/omitted list still means "every page".
- The main-thread implementation and the worker both iterate that list, report
  progress against it, and return blobs in the same order.
- `SplitView` passes its selection and names the files by the real page numbers.

**Affected files**
- `src/services/pdf/convertOperation.ts`
- `src/workers/pdfProcessor.worker.ts`
- `src/components/features/SplitView/SplitView.tsx`
- `tests/services/convertOperation.test.ts`
- `tests/components/SplitView.test.tsx`

## Issue 19: No ceiling on client-side work (pages per operation, files per operation)

**Description**
Nothing limited how much work a single action could queue. A large PDF meant the
thumbnail grid tried to rasterise every page, preview rendered an unbounded
document, image export rendered page after page, and Merge/Convert accepted any
number of files. This is a browser tab with no server: past a few hundred pages
the tab becomes unresponsive or is killed by the OS, and the user gets no
explanation.

**Root cause**
Every loop was written as "for each page of the document" with no bound, and no
layer (validation, view, service) owned a limit.

**Fix**
- Added `CONST_LIMITS_CONFIG` (documented in `src/config/constants.ts`):
  `maxPagesPerDocument: 50`, `maxThumbnailPages: 50`,
  `maxImageExportPages: 50`, `maxFilesPerOperation: 20`, plus matching messages
  in `CONST_ERROR_MESSAGES`.
- `validatePDFFull` rejects documents over the page limit, which covers Merge,
  Split, Rotate, Organize and image conversion with one check.
- `PreviewModal` refuses to open an over-limit document, `PageThumbnails` renders
  the first 50 pages and says so, Merge/Convert keep at most 20 files and explain
  why, and Split refuses an image export over the page limit.

**Affected files**
- `src/config/constants.ts`, `src/config/index.ts`
- `src/services/pdf/pdfValidation.ts`
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `src/components/common/PreviewModal/PreviewModal.tsx`
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/SplitView/SplitView.tsx`
- `tests/services/pdfValidation.test.ts`, `tests/components/PageThumbnails.test.tsx`,
  `tests/components/MergeView.test.tsx`

