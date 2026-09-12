# PDF Buddy - Improvement Plan

Date: 2026-09-12
Scope: `src/`, `tests/`, `scripts/`, build/test config, `README.md`, `docs/`
Method: static reading of the source plus the production build output. Nothing in
this document was confirmed by a runtime run unless the item says so; the
"Needs a runtime check" section lists the open questions.

Related: concrete defects found during the same pass are listed separately in
[bug-fix-plan.md](./bug-fix-plan.md).

## Status (2026-09-12)

Done in the follow-through pass:

- P0-1 PreviewModal image cache is now LRU-bounded
  (`CONST_CACHE_CONFIG.previewImageCacheCapacity`).
- P0-2 JSZip and pdf-lib are separate vendor chunks; the app chunk that used to
  be 520 kB is now ~85 kB, and `scripts/run_build.py` enforces a 400 kB budget on
  application chunks.
- P0-3 Thumbnail rendering yields between chunks.
- P1-1 PreviewModal is a real dialog (role, `aria-modal`, focus in/out, Tab trap).
- P1-2 Split preview failures surface in an `ErrorBanner`.
- P1-3 `pdfCache` hashes head + tail (`contentHashSampleSize`).
- P1-4 `usePDFOperation` is generic over its result; `any` is gone from the
  feature hooks and from the thumbnail document ref.
- P1-5 Test gaps closed for range export, Organize reorder, preview failures,
  cache collisions, file changes and drop rejections.
- P2-3 `tests/services/pdfIndex.test.ts` guards the services barrel.
- P2-4 Build budget enforced in `scripts/run_build.py`.

Still open (see the items below):

- P2-1 Routing Merge/Split/Rotate/Organize through `pdfProcessor.worker.ts`.
  Verified status: only Convert uses the worker today
  (`ConvertView` -> `useWorkerPDFOperation`); the worker bundle is built and
  ships, so the other views still block the main thread during heavy work.
- P2-2 is partially done (rejections now name the file); the "accept a `.pdf`
  by name only" weakness remains.

---

## P0 - highest value, do first

### P0-1 Bound the PreviewModal page-image cache

**Why it matters.** `pageImageCache` is a module-level `Map` that stores one
base64 data URL per rendered page and is never evicted
(`src/components/common/PreviewModal/PreviewModal.tsx:17`, written at `:168`).
Only `clearPreviewImageCache()` (`:20`), which exists for tests, ever removes
entries. On a low-memory machine, previewing a few multi-page PDFs accumulates
many megabytes of strings that can never be collected.

**Proposed change.** Give the cache a capacity from
`CONST_CACHE_CONFIG` (same LRU pattern as `src/services/pdf/pdfCache.ts`), and
drop a file's entries when the modal closes or the file changes. Key by
`getFileId(file)` (already implemented in `src/utils/fileUtils.ts`) instead of
the ad-hoc `${fileId}-page-${i}` string built in the component.

**Effort.** S

**Done when.** A unit test previews more pages across more files than the cache
capacity and asserts the number of retained entries never exceeds it, and the
mode/zoom/lazy-load tests in `tests/components/PreviewModal.test.tsx` still pass.

### P0-2 Keep the main bundle free of JSZip

**Why it matters.** The production build reports a 519 kB chunk named
`downloadUtils-*.js` (gzip 206 kB) alongside a separate 97 kB `jszip` chunk, and
the main entry is 154 kB. `downloadBlobsAsZip` pulls `jszip` in with an inline
`await import('jszip')` inside `src/utils/downloadUtils.ts`, so the download
helper module is entangled with the archive library.

**Proposed change.** Move archive creation into its own module
(`src/utils/zipUtils.ts`) that is only imported dynamically by the Split view,
or add an explicit `build.rollupOptions.output.manualChunks` entry so `jszip`
never lands next to `downloadBlob`. `downloadBlob` itself needs no dependency.

**Effort.** S

**Done when.** `python scripts/run_build.py` shows the utility chunk well under
100 kB and `jszip` only in its own lazily loaded chunk; exporting multiple pages
still produces a `.zip` (covered by `tests/utils/downloadUtils.test.ts`).

### P0-3 Make thumbnail work yield to the UI

**Why it matters.** `PageThumbnails` parses and rasterises up to three pages at
a time directly on the main thread
(`src/components/common/PageThumbnails/PageThumbnails.tsx` - `renderPage` /
`worker()`), one canvas data URL per page. On this 13-year-old machine a
20-page PDF makes the window unresponsive while thumbnails stream in; the
existing `src/workers/pdfProcessor.worker.ts` is not used for rendering.

**Proposed change.** Either render thumbnails in the worker (transfer
`ImageBitmap` back to the main thread) or at minimum yield between chunks
(`await scheduler.yield?.()` / `requestIdleCallback` fallback) and lower
`CONST_THUMBNAIL_CONFIG.concurrencyLimit` when `navigator.hardwareConcurrency`
is small.

**Effort.** M

**Done when.** Loading a 20-page PDF keeps the page interactive (no long task
over ~50 ms in the Performance panel) and the thumbnail tests still pass.

---

## P1 - worth doing next

### P1-1 Give PreviewModal proper dialog semantics

**Why it matters.** The modal has `aria-label`s on its buttons and an Escape
handler (`PreviewModal.tsx:35`, `:217`, `:254`), but no `role="dialog"`, no
`aria-modal`, no accessible name for the dialog itself, and no focus management -
keyboard focus stays on the page behind it.

**Proposed change.** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
pointing at the header (`:216`), move focus to the dialog on open, restore it to
the trigger on close, and trap Tab inside while open.

**Effort.** S

**Done when.** A component test asserts the dialog role/name, that focus lands
inside on open and returns to the trigger on close, and that Tab cycles within
the modal.

### P1-2 Stop swallowing preview failures

**Why it matters.** `SplitView.handlePreview` catches errors into an empty block
with the comment "Preview failures are silently ignored"
(`src/components/features/SplitView/SplitView.tsx`, around the `try/catch` in
`handlePreview`). The user clicks Preview, nothing happens, and no explanation
is shown.

**Proposed change.** Route the failure through the existing `ErrorBanner` state
(`useSplit().error` is only for the split operation, so add a local preview error
or a shared `usePreview` error hook).

**Effort.** S

**Done when.** A component test makes the mocked service reject and asserts the
error banner appears.

### P1-3 Strengthen the PDF cache identity

**Why it matters.** `computeContentHash` hashes only the first 4 kB of the file
(`src/services/pdf/pdfCache.ts:20-25`) and the cache key is
`name_size_hash` (`:36`). Two same-size PDFs sharing a 4 kB prefix collide, and
the cache has no time-based invalidation even though
`CONST_PDF_CONFIG.cacheTimeout` exists.

**Proposed change.** Hash size plus the first and last 4 kB, or key by the
per-`File` identity already available through `getFileId`
(`src/utils/fileUtils.ts`, `WeakMap`-backed) and keep the content hash only as a
secondary signal.

**Effort.** S

**Done when.** A unit test with two same-size files that share a 4 kB prefix
asserts they do not share a cache entry.

### P1-4 Remove `any` from the PDF plumbing

**Why it matters.** `PageThumbnails` holds `useRef<any>`
(`src/components/common/PageThumbnails/PageThumbnails.tsx`), `usePDFOperation`
returns `Promise<any>`, and `useWorkerPDFOperation.result` is `unknown`. The
typed contracts for the five operations already exist in
`src/services/pdf/types.ts`, but the view layer bypasses them.

**Proposed change.** Type `usePDFOperation<TParams, TResult>` and have each
feature hook declare its result type (`Promise<Blob>`, `Promise<Blob[]>`, ...);
reuse the pdfjs types already imported for the document object.

**Effort.** M

**Done when.** `python scripts/run_lint.py` passes with no `any` in those
signatures and the unit suite still passes.

### P1-5 Close the remaining test gaps

**Why it matters.** Several user-visible behaviours have no automated coverage.

**Proposed change (each is a concrete test, not "more tests"):**

- Split, range mode: two pages selected via the Page Ranges input produce a
  `.zip`, one page produces a `.pdf` (mock `ClientPDFService`).
- Split, range mode: input that parses to nothing leaves Export disabled
  (see B-3 in the bug plan).
- Organize: dragging page 1 after page 3 changes the rendered order (B-1).
- `downloadBlob`: already covered by `tests/utils/downloadUtils.test.ts`.
- `vite.config.ts` `worker.format === 'es'`: covered by
  `tests/config/viteConfig.test.ts` (added during this review).

**Effort.** M

**Done when.** The above tests exist and fail if the behaviour regresses.

---

## P2 - polish and hygiene

### P2-1 Worker path for heavy operations

`useWorkerPDF`/`pdfProcessor.worker.ts` exist and `vite.config.ts` sets
`worker.format: 'es'` so worker bundles may code-split. Confirm which views
actually route through the worker; Merge on a 50 MB file is the obvious
candidate. *Needs a runtime check.*

### P2-2 Small-file validation and messaging

`DropZone` rejects by MIME/size with generic copy ("File type not accepted or
file too large"); it accepts any file whose name ends in `.pdf` regardless of
content, and the rejection message does not say which file failed. Surface the
rejected file name and the reason from `CONST_ERROR_MESSAGES`.

### P2-3 Documentation drift guard

`docs/SPEC.md`, `docs/implementation.md` and `docs/testplan.md` are hand-kept and
were stale about the removed Compress feature until recently.
`tests/docs/featureDocs.test.ts` already guards the feature list; extend the same
idea to the file-inventory tables in `docs/implementation.md` so a renamed module
fails a test instead of silently rotting.

### P2-4 Performance budget

`tests/utils/performance.test.ts` covers helper utilities only. Add a budget
assertion for the build output (main chunk size) so the P0-2 work cannot regress.

---

## Needs a runtime check

1. Whether the 519 kB `downloadUtils` chunk is loaded on first paint today, or
   only when an export runs (the build alone does not prove lazy loading).
2. Whether thumbnail rendering actually blocks the UI, and by how much, on a
   20-page PDF.
3. Which views route through `pdfProcessor.worker.ts` in practice (P2-1).
4. Current E2E status: the suite is red on this machine, but every failure seen
   so far is a browser-level error
   (`browser.newContext: Target page, context or browser has been closed`), not
   an assertion failure - see the note at the end of `docs/bug-fix-plan.md`.
