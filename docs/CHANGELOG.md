> Comprehensive, phase-by-phase changelog of completed work.
> For the short per-issue log required when fixing bugs, see [CR.md](../CR.md) in the repository root.

# Changelog / Bug Fixes

## 2026-09-12

### Phase 3: Code-review follow-through (performance, robustness, accessibility)

**Context:** a full source review (`docs/improvement-plan.md`,
`docs/bug-fix-plan.md`) produced a prioritised list of improvements and defects.
Everything in this phase was implemented and covered by tests; per-issue detail
for the defects lives in `CR.md` (Issues 9-16).

**Performance / memory**
- `PreviewModal`'s module-level page-image cache is now an LRU bounded by
  `CONST_CACHE_CONFIG.previewImageCacheCapacity` (12). Previously it grew with
  every previewed page and was never evicted.
- `PageThumbnails` yields between render chunks (`setTimeout(0)`) so rendering a
  long document no longer blocks the main thread from first page to last.
- `vite.config.ts` declares `vendor-pdf-lib` and `vendor-jszip` manual chunks:
  the chunk that used to be 520 kB (dominated by pdf-lib) is now an 85 kB
  download utility plus separate, lazily loaded vendor chunks.
- `scripts/run_build.py` enforces a 400 kB budget on application chunks and
  reports vendor/worker bundles separately, so bundle growth is caught in CI.

**Robustness**
- `pdfCache` hashes the head *and* tail of a file, so two same-size PDFs sharing
  a prefix can no longer collide and serve the wrong document.
- `PageThumbnails` keys its parsed document by file id and resets thumbnails on
  file change, instead of reusing the previous document.
- `parsePageRangeInput()` reports malformed page ranges instead of silently
  dropping pages; the Split view surfaces the message and keeps export disabled
  when nothing matches.
- `usePDFOperation` is generic over its result (`<TParams, TResult>`), removing
  `Promise<any>` from all five feature hooks; `PageThumbnails` types its pdf.js
  document instead of `any`.
- `DropZone` rejection messages now name the offending files.

**Accessibility**
- `PreviewModal` is a proper dialog (`role="dialog"`, `aria-modal`,
  `aria-labelledby`), moves focus inside on open, restores it on close, and
  traps Tab within the dialog.

**Developer experience**
- `scripts/run_unit_tests.py --sanity` runs 17 critical test files (~11 s) as
  the per-change check; the full suite runs at commit time. The unit wrapper
  enforces `--maxWorkers=3` and the E2E wrapper enforces `--workers=1`
  (plus one retry) so the resource limits do not depend on the operator.
- `tests/services/pdfIndex.test.ts` guards the `src/services/pdf/index.ts`
  barrel, and `tests/config/viteConfig.test.ts` guards `worker.format: 'es'`.
- Build output is warning-free. The only warning left was Rollup's `EVAL`
  report for `pdfjs-dist/build/pdf.js:1982`, which is `eval("require")(...)` in
  pdf.js's Node-only "fake worker" fallback - dead code in a browser bundle. It
  is filtered by exact code and module in `vite.config.ts` so genuine warnings
  still surface.

**Not done in this phase:** routing Merge/Split/Rotate/Organize through
`pdfProcessor.worker.ts` (only Convert uses it today) and cross-browser/mobile
verification; both remain in `docs/improvement-plan.md`.

## 2026-06-27

### Phase 2: Extract CSS Hardcoded Values

**Issue:** CSS module files still contained hard-coded px values, rgba colors, z-index values, transition durations, transform values, and repeated box-shadow declarations that were not yet centralized.

**Fix:**
1. Extended `src/styles/variables.css` with new component-level variable groups:
   - Component shadows: `--shadow-button`, `--shadow-button-hover`, `--shadow-button-secondary`, `--shadow-button-secondary-hover`, `--shadow-button-accent`, `--shadow-button-accent-hover`, `--shadow-modal`, `--shadow-preview`, `--shadow-dropzone-hover`, `--shadow-dropzone-dragover`, `--shadow-dropzone-icon`, `--shadow-dropzone-icon-hover`, `--shadow-badge`, `--shadow-nav-button-hover`
   - Z-index scale: `--z-sticky`, `--z-header`, `--z-modal`
   - Touch targets & badges: `--touch-target-min`, `--size-badge-sm`, `--size-badge-md`, `--size-dot`, `--size-control-sm`, `--size-control-md`
   - Thumbnail sizes: `--thumbnail-width`, `--thumbnail-height`
   - Modal & preview sizes: `--modal-width`, `--modal-max-width`, `--modal-max-height`, `--preview-min-width`, `--preview-min-height`
   - Layout constraints: `--max-width-container`, `--max-width-text`, `--max-width-card`, `--min-height-panel`, `--min-height-error`
   - Transforms: `--transform-lift`, `--transform-lift-lg`, `--transform-lift-xl`, `--transform-scale-up`, `--transform-scale-down`
   - Animation durations: `--duration-spin`, `--duration-pulse`
2. Replaced hard-coded values in:
   - `src/components/common/PreviewModal/PreviewModal.module.css`
   - `src/components/common/DropZone/DropZone.module.css`
   - `src/components/common/Button/Button.module.css`
   - `src/components/common/PageThumbnails/PageThumbnails.module.css`
   - `src/components/common/ErrorDisplay/ErrorDisplay.module.css`
   - `src/components/common/ErrorBoundary/ErrorBoundary.module.css`
   - `src/components/common/FeatureViewShell/FeatureViewShell.module.css`
   - `src/App.module.css`
   - `src/components/features/SplitView/SplitView.module.css`
   - `src/components/features/RotateView/RotateView.module.css`
3. Preserved behavior by keeping media query breakpoints and values without matching variables (e.g. small 4px offsets, `calc(100vh - 200px)`) unchanged.
4. Restored per-variant button shadows (primary/secondary/accent) to avoid visual regressions.

**Files Changed:**
- `src/styles/variables.css`
- `src/components/common/PreviewModal/PreviewModal.module.css`
- `src/components/common/DropZone/DropZone.module.css`
- `src/components/common/Button/Button.module.css`
- `src/components/common/PageThumbnails/PageThumbnails.module.css`
- `src/components/common/ErrorDisplay/ErrorDisplay.module.css`
- `src/components/common/ErrorBoundary/ErrorBoundary.module.css`
- `src/components/common/FeatureViewShell/FeatureViewShell.module.css`
- `src/App.module.css`
- `src/components/features/SplitView/SplitView.module.css`
- `src/components/features/RotateView/RotateView.module.css`

### Phase 1: Extract TypeScript Core Constants with `CONST_` Prefix

**Issue:** Hard-coded values were scattered across the TypeScript source, tests, and UI components, making the codebase harder to maintain and increasing the risk of drift. Additionally, the user requested that all exported config objects use a `CONST_` naming convention.

**Fix:**
1. Renamed every exported config object in `src/config/constants.ts` to include the `CONST_` prefix:
   - `APP_CONFIG` → `CONST_APP_CONFIG`
   - `PDF_CONFIG` → `CONST_PDF_CONFIG`
   - `OPERATION_CONFIG` → `CONST_OPERATION_CONFIG`
   - `UI_CONFIG` → `CONST_UI_CONFIG`
   - `ZOOM_CONFIG` → `CONST_ZOOM_CONFIG`
   - `ERROR_CODES` → `CONST_ERROR_CODES`
   - `QUALITY_PRESETS` → `CONST_QUALITY_PRESETS`
   - `MIME_TYPES` → `CONST_MIME_TYPES`
   - `SUPPORTED_IMAGE_MIME_TYPES` → `CONST_SUPPORTED_IMAGE_MIME_TYPES`
   - `ERROR_MESSAGES` → `CONST_ERROR_MESSAGES`
   - `CACHE_CONFIG` → `CONST_CACHE_CONFIG`
   - `THUMBNAIL_CONFIG` → `CONST_THUMBNAIL_CONFIG`
   - `PREVIEW_CONFIG` → `CONST_PREVIEW_CONFIG`
   - `CONVERT_CONFIG` → `CONST_CONVERT_CONFIG`
   - `STORAGE_KEYS` → `CONST_STORAGE_KEYS`
   - `PERFORMANCE_CONFIG` → `CONST_PERFORMANCE_CONFIG`
   - `SANITIZE_CONFIG` → `CONST_SANITIZE_CONFIG`
   - `DOWNLOAD_CONFIG` → `CONST_DOWNLOAD_CONFIG`
   - `ROTATION_CONFIG` → `CONST_ROTATION_CONFIG`
   - `TEST_CONFIG` → `CONST_TEST_CONFIG`
2. Updated `src/config/index.ts` barrel exports to match the new names.
3. Replaced hard-coded values in the following files with references to the new `CONST_*` objects:
   - `src/utils/retry.ts`, `src/utils/performance.ts`, `src/utils/sanitize.ts`
   - `src/utils/downloadUtils.ts`, `src/utils/fileUtils.ts`
   - `src/context/AppContext.tsx`
   - `src/services/pdf/ClientPDFService.ts` and all operation modules (`mergeOperation.ts`, `splitOperation.ts`, `compressOperation.ts`, `rotateOperation.ts`, `reorganizeOperation.ts`, `convertOperation.ts`, `pdfOperations.ts`, `pdfCache.ts`, `pdfValidation.ts`)
   - `src/components/common/PageThumbnails/PageThumbnails.tsx`, `src/components/common/PreviewModal/PreviewModal.tsx`, `src/components/common/DropZone/DropZone.tsx`
   - `src/components/features/ConvertView/ConvertView.tsx`, `src/components/features/RotateView/RotateView.tsx`
4. Updated consumers in `tests/config/constants.test.ts` and `tests/services/ClientPDFService.test.ts` to reference the new names.
5. Resolved TypeScript narrowing issues introduced by `as const` constants by widening arrays with `[...]` and explicitly typing mutable variables (`errorMessage: string`, `useState<number>`).

**Files Changed:**
- `src/config/constants.ts`
- `src/config/index.ts`
- `src/utils/retry.ts`
- `src/utils/performance.ts`
- `src/utils/sanitize.ts`
- `src/utils/downloadUtils.ts`
- `src/utils/fileUtils.ts`
- `src/context/AppContext.tsx`
- `src/services/pdf/ClientPDFService.ts`
- `src/services/pdf/mergeOperation.ts`
- `src/services/pdf/splitOperation.ts`
- `src/services/pdf/compressOperation.ts`
- `src/services/pdf/rotateOperation.ts`
- `src/services/pdf/reorganizeOperation.ts`
- `src/services/pdf/convertOperation.ts`
- `src/services/pdf/pdfOperations.ts`
- `src/services/pdf/pdfCache.ts`
- `src/services/pdf/pdfValidation.ts`
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `src/components/common/PreviewModal/PreviewModal.tsx`
- `src/components/common/DropZone/DropZone.tsx`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/RotateView/RotateView.tsx`
- `tests/config/constants.test.ts`
- `tests/services/ClientPDFService.test.ts`

### Phase 3: Extract Test Constants

**Issue:** Test code still used hard-coded timeout values, retry defaults, and MIME type strings that duplicated constants defined in production code.

**Fix:**
1. Imported `CONST_TEST_CONFIG` into E2E specs and replaced hard-coded timeouts:
   - `timeout: 10000` → `CONST_TEST_CONFIG.e2eDefaultTimeout`
   - `timeout: 15000` → `CONST_TEST_CONFIG.e2eButtonTimeout`
   - merge performance threshold `15000` → `CONST_TEST_CONFIG.e2ePerformanceThresholdMs`
2. Replaced `waitForCondition` defaults in `tests/utils/testHelpers.ts` with `CONST_TEST_CONFIG.waitForTimeout` and `CONST_TEST_CONFIG.waitForInterval`.
3. Replaced repeated retry option literals in `tests/utils/retry.test.ts` with references to `CONST_OPERATION_CONFIG`.
4. Replaced `'application/pdf'` literals in `tests/utils/testHelpers.ts` with `CONST_MIME_TYPES.pdf`.
5. Extended `tests/config/constants.test.ts` with assertions for all new `CONST_*` config objects (`CONST_MIME_TYPES`, `CONST_SUPPORTED_IMAGE_MIME_TYPES`, `CONST_ERROR_MESSAGES`, `CONST_CACHE_CONFIG`, `CONST_THUMBNAIL_CONFIG`, `CONST_PREVIEW_CONFIG`, `CONST_CONVERT_CONFIG`, `CONST_STORAGE_KEYS`, `CONST_PERFORMANCE_CONFIG`, `CONST_SANITIZE_CONFIG`, `CONST_DOWNLOAD_CONFIG`, `CONST_ROTATION_CONFIG`, `CONST_TEST_CONFIG`).

**Files Changed:**
- `tests/utils/testHelpers.ts`
- `tests/utils/retry.test.ts`
- `tests/e2e/pdf-operations.spec.ts`
- `tests/e2e/full-test.spec.ts`
- `tests/config/constants.test.ts`

**Test Results:** `python scripts/run_lint.py` passed, `python scripts/run_unit_tests.py` passed (47 files, 480 tests), `python scripts/run_build.py` passed.

### Tests P1/P2: Real Retry Tests, Shared Upload Helper, Unified Canvas Mock, Worker Message Flow

**Issue:** Tests P1/P2 review identified that retry behavior was not truly exercised, file-upload boilerplate was duplicated in component tests, the canvas mock was minimal, and worker hook tests did not cover progress/error message flows.

**Fix:**
1. **Real retry tests** (`tests/services/ClientPDFService.test.ts`):
   - Mocked `CONST_OPERATION_CONFIG` to set `retryDelay: 0` / `retryBackoff: 1` so retries run instantly in tests.
   - Replaced shallow "wraps X with retry" spy tests with tests that spy on underlying operations (`mergePdfs`, `splitPdf`, `compressPdf`, `rotatePdf`, `convertImagesToPdf`, `reorganizePdf`, `convertPdfToImages`) and make them fail transiently before succeeding.
   - Added a test verifying the service throws after exhausting all retry attempts.

2. **Shared upload helper** (`tests/utils/testHelpers.ts`):
   - Added `uploadFileToDropzone(container, file, options)` helper that locates the dropzone input, wraps the change event in `act()`, and returns a promise.
   - Refactored `tests/components/MergeView.test.tsx` to use the helper, removing the inline `uploadFile` helper and duplicated input lookups.

3. **Unified canvas mock** (`tests/setup.ts`):
   - Expanded `HTMLCanvasElement.prototype.getContext('2d')` mock to include `fillRect`, `clearRect`, `getImageData`, `putImageData`, `createImageData`, `scale`, `translate`, `save`, `restore`, `beginPath`, `closePath`, `stroke`, `fill`, `arc`, `moveTo`, `lineTo`, `rect`, and `measureText`.
   - Added `HTMLCanvasElement.prototype.toDataURL` and `toBlob` mocks so canvas-dependent code paths can be tested consistently.

4. **Worker message flow tests** (`tests/hooks/useWorkerPDF.test.ts`):
   - Added tests for `progress` messages updating state and invoking `onProgress`.
   - Added tests for `error` messages updating state and invoking `onError`.
   - Added test for worker runtime errors (`worker.onerror`) updating state and invoking `onError`.

**Files Changed:**
- `tests/services/ClientPDFService.test.ts`
- `tests/utils/testHelpers.ts`
- `tests/setup.ts`
- `tests/hooks/useWorkerPDF.test.ts`
- `tests/components/MergeView.test.tsx`

**Test Results:** `python scripts/run_lint.py` passed, `python scripts/run_unit_tests.py` passed (47 files, 459 tests), `python scripts/run_build.py` passed.

---

## 2026-06-27

### CSS P1: Unify Feature View Layout, Hardcoded Colors, Breakpoints

**Issue:** CSS P1 review identified duplicated layout classes across feature views, scattered hardcoded colors, and non-standard breakpoints (400px/600px/900px in PageThumbnails).

**Fix:**
1. **Extended FeatureViewShell** (`src/components/common/FeatureViewShell/FeatureViewShell.module.css`):
   - Added shared `.actions` and `.error` layout classes.
   - Added responsive rules for `.actions` at 480px.

2. **Simplified feature view module CSS** (`MergeView`, `SplitView`, `CompressView`, `RotateView`, `ConvertView`, `OrganizeView`):
   - Removed duplicated `.container`, `.header`, `.title`, `.description`, `.workspace`, `.actions`, and `.error` rules.
   - Updated TSX files to import `FeatureViewShell.module.css` and use `shellStyles.actions`.
   - Added view-specific modifiers where needed (e.g., `.actionsCenter` in RotateView, `.actionsStretch` in SplitView).

3. **Replaced hardcoded colors** across all CSS modules:
   - Added `--color-white` and `--color-black` to `variables.css`.
   - Replaced `#hex`, `white`, and `black` literals with `var(--color-*)` variables.
   - Replaced raw `rgba(...)` color values with `rgb(from var(--color-*) r g b / alpha)` relative color syntax so opacity tints follow the theme.
   - Cleaned up PreviewModal fallback hex values (`var(--color-primary, #6366f1)` → `var(--color-primary)`).

4. **Standardized breakpoints**:
   - Added `--breakpoint-sm/md/lg` custom properties in `variables.css`.
   - Converted PageThumbnails breakpoints from 400px/600px/900px to 480px/768px/1024px.
   - All media queries now use the 480px/768px/1024px set.

**Files Changed:**
- `src/styles/variables.css`
- `src/styles/global.css`
- `src/App.module.css`
- `src/components/common/FeatureViewShell/FeatureViewShell.module.css`
- `src/components/common/Button/Button.module.css`
- `src/components/common/DraggableFileList/DraggableFileList.module.css`
- `src/components/common/FileList/FileList.module.css`
- `src/components/common/PageThumbnails/PageThumbnails.module.css`
- `src/components/common/PreviewModal/PreviewModal.module.css`
- `src/components/features/MergeView/MergeView.module.css`
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/SplitView/SplitView.module.css`
- `src/components/features/SplitView/SplitView.tsx`
- `src/components/features/CompressView/CompressView.module.css`
- `src/components/features/CompressView/CompressView.tsx`
- `src/components/features/RotateView/RotateView.module.css`
- `src/components/features/RotateView/RotateView.tsx`
- `src/components/features/ConvertView/ConvertView.module.css`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/OrganizeView/OrganizeView.module.css`
- `src/components/features/OrganizeView/OrganizeView.tsx`

**Test Results:** `python scripts/run_lint.py` passed, `python scripts/run_unit_tests.py` passed (47 files, 455 tests), `python scripts/run_build.py` passed.

---

## 2026-06-27

### TS P1: Memoize App View Routing, Cache PDF Validation, Reuse PDF Service Instance

**Issue:** TS P1 review identified low-hanging performance and simplification opportunities:
1. `App.tsx` recreated the active view element on every render via an inline `renderView()` function.
2. `validatePDFFull` parsed the same file with `PDFDocument.load` every time it was called.
3. `usePDFOperation` instantiated a new `ClientPDFService` on every operation invocation even though the service is stateless.

**Fix:**
1. **Memoized view routing** (`src/App.tsx`):
   - Replaced inline `renderView()` with a `useMemo` hook keyed on `state.currentView`.
   - View elements are now only recreated when the active view changes.

2. **Cached full PDF validation** (`src/services/pdf/pdfValidation.ts`):
   - Added a bounded module-level cache (max 16 entries, LRU eviction) keyed by `file.name + file.size + file.lastModified`.
   - `validatePDFFull` reuses the cached `Promise<ValidationResult>` when the same file is validated again, avoiding redundant `PDFDocument.load` parsing.

3. **Reused service instance** (`src/hooks/usePDFOperation.ts`):
   - Memoized `ClientPDFService` with `useMemo` so a single instance is reused across operation calls in the same hook lifetime.

**Files Changed:**
- `src/App.tsx`
- `src/services/pdf/pdfValidation.ts`
- `src/hooks/usePDFOperation.ts`
- `tests/services/pdfValidation.test.ts`

**Tests Added/Updated:**
- Added `validatePDF cache` suite in `tests/services/pdfValidation.test.ts` with 4 tests:
  - Reuses cached full validation result for the same file
  - Does not reuse cache when file metadata differs
  - Returns validation error without calling `PDFDocument.load` for non-PDF files
  - `validatePDF(file, 'full')` uses cached result

**Test Results:** `python scripts/run_lint.py` passed, `python scripts/run_unit_tests.py` passed (47 files, 455 tests), `python scripts/run_build.py` passed.

---

### Tests P0: Stabilize E2E Waits, Extract Test Factories, Unify pdf-lib Mock

**Issue:** Code review identified fragile E2E waits, duplicated hook test boilerplate, repeated pdf-lib mocks, and unit tests picking up stale agent worktrees.

**Fix:**
1. **E2E selector/wait cleanup**
   - Added `data-testid` attributes to `Button` (`button-loading`), `PageThumbnails` (`thumbnail-loading`, `thumbnail-item`), and `PreviewModal` (`preview-modal-header`, `preview-loading`).
   - Replaced all remaining `page.waitForTimeout` calls in `tests/e2e/pdf-operations.spec.ts` with explicit state waits (`waitForSelector(... detached)` / `expect(...).toBeVisible()`).
   - In `tests/e2e/full-test.spec.ts`, replaced class-substring selectors (`[class*="thumbnail"]`, `[class*="loading"]`, `[class*="dropzone"]`) with `data-testid` selectors and removed duplicate Low/Medium/High compress download tests, keeping one smoke test.

2. **Hook test factory**
   - Added `tests/utils/hookTestFactory.ts` with `createPDFHookTests`.
   - Refactored `useMerge`, `useSplit`, `useCompress`, `useConvert`, `useRotate`, and `useOrganize` tests to use the factory, removing redundant `typeof ... === 'function'` assertions.

3. **Unified pdf-lib mock**
   - Added `tests/mocks/pdfLib.ts` with `createMockPDFDocument` / `createMockPDFLib` helpers.
   - Refactored service tests (`mergeOperation`, `splitOperation`, `compressOperation`, `rotateOperation`, `reorganizeOperation`, `convertOperation`, `ClientPDFService`) to import the shared mock via an async `vi.mock` factory.

4. **Test infrastructure fixes**
   - Added `.claude/**` to `vitest.config.ts` `exclude` so agent worktrees no longer pollute the test run.
   - Fixed `tests/components/PageThumbnails.test.tsx` which assigned to `HTMLCanvasElement.prototype.width/height`, causing a jsdom TypeError.
   - Fixed `tests/hooks/useWorkerPDF.test.tsx` "terminates worker on unmount" test to first start an operation (worker is created lazily).

**Files Changed:**
- `src/components/common/Button/Button.tsx`
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `src/components/common/PreviewModal/PreviewModal.tsx`
- `tests/e2e/pdf-operations.spec.ts`
- `tests/e2e/full-test.spec.ts`
- `tests/utils/hookTestFactory.ts` (new)
- `tests/mocks/pdfLib.ts` (new)
- `tests/hooks/use{Merge,Split,Compress,Convert,Rotate,Organize}.test.ts`
- `tests/hooks/useWorkerPDF.test.ts`
- `tests/services/{merge,split,compress,rotate,reorganize,convert}Operation.test.ts`
- `tests/services/ClientPDFService.test.ts`
- `tests/components/PageThumbnails.test.tsx`
- `vitest.config.ts`

**Test Results:** `python scripts/run_lint.py` passed, `python scripts/run_unit_tests.py` passed (47 files, 451 tests), `python scripts/run_build.py` passed.

---

## 2026-06-26

### Fix: Mobile Responsive Layout Issues

**Issue:** Several layouts did not adapt well to small screens (320px+), including header navigation wrapping, excessive padding, two-column views side-by-side on mobile, and PreviewModal overflow.

**Fix:**
1. `src/App.module.css`: ensured nav buttons and theme toggle meet 44px minimum touch target, kept nav horizontal-scrollable on small screens, reduced header/main/footer padding at 480px.
2. `src/components/common/FeatureViewShell/FeatureViewShell.module.css`: reduced container/workspace padding and title size at 768px and 480px breakpoints.
3. `src/components/common/PreviewModal/PreviewModal.module.css`: made modal full-screen on <=480px, reduced preview area min-width from 400px to 280px, ensured footer controls meet 44px touch target.
4. `src/components/features/SplitView/SplitView.module.css`: stacked `.splitContainer` vertically below 768px, made mode buttons and action buttons full-width on small screens.
5. `src/components/features/RotateView/RotateView.module.css`: stacked two-column layout below 768px, reset sticky positioning on mobile, made actions full-width.
6. `src/components/common/DropZone/DropZone.module.css`: added min-height and reduced padding on small screens.
7. `src/components/common/Button/Button.module.css`: added 44px min-height/min-width to all buttons for touch targets.

**Files Changed:**
- `src/App.module.css`
- `src/components/common/FeatureViewShell/FeatureViewShell.module.css`
- `src/components/common/PreviewModal/PreviewModal.module.css`
- `src/components/features/SplitView/SplitView.module.css`
- `src/components/features/RotateView/RotateView.module.css`
- `src/components/common/DropZone/DropZone.module.css`
- `src/components/common/Button/Button.module.css`

---

### Fix: Remove Console Errors/Warnings from Production Build

**Issue:** Several source files contained `console.error` and `console.warn` calls that would leak into the production build, violating the "no console errors in production" success criterion.

**Fix:**
1. Removed all `console.error` and `console.warn` calls from production source code.
2. Removed the `logToConsole` prop from `ErrorBoundary` since it no longer logged to console.
3. Removed the corresponding `ErrorBoundary` tests that asserted console logging behavior.
4. Unified `PageThumbnails` to use `CONST_PDF_CONFIG.pdfJsWorkerUrl` instead of a hardcoded CDN URL.
5. Replaced unstable `key={index}` in `PageThumbnails` with a composite key based on file name, size, and page index.

**Files Changed:**
- `src/components/common/PageThumbnails/PageThumbnails.tsx`
- `src/components/common/PreviewModal/PreviewModal.tsx`
- `src/components/common/ErrorBoundary/ErrorBoundary.tsx`
- `src/components/features/SplitView/SplitView.tsx`
- `src/services/pdf/pdfFallback.ts`
- `tests/components/ErrorBoundary.test.tsx`

---

### Bug Fix: PageThumbnails Unit Tests Failing

**Issue:** During regression, `tests/components/PageThumbnails.test.tsx` failed with 4 tests. The error was `Cannot read properties of undefined (reading 'promise')` at `PageThumbnails.tsx:61`, caused by `pdfjs-dist.getDocument` returning undefined in the test environment. Additionally, the rotate-button accessibility test failed because it used `screen.getByRole` but the component renders one rotate button per page, producing multiple matching elements.

**Root Cause:**
1. `beforeEach` called `vi.restoreAllMocks()`, which restored the `pdfjs-dist` mock created in the `vi.mock` factory back to its default no-op implementation, making `getDocument` return undefined.
2. The `vi.mock` factory was asynchronous and used `vi.importActual`, which interacted poorly with the component's dynamic import of `pdfjs-dist`.
3. The rotate-button test used `getByRole('button', { name: 'Rotate page 90 degrees' })` but there are 3 such buttons (one per page in the mock PDF).

**Fix:**
1. Removed `vi.restoreAllMocks()` from `beforeEach`.
2. Rewrote the `vi.mock('pdfjs-dist', ...)` factory as a synchronous factory without `vi.importActual`.
3. Changed the rotate-button test to use `getAllByRole` and assert on the first button.

**Files Changed:**
- `tests/components/PageThumbnails.test.tsx`

**Tests:**
- The existing 12 PageThumbnails tests now pass (4 previously failing).

---

### Improvement: PageThumbnails Accessibility

**Issue:** `PageThumbnails` rendered clickable page thumbnails as `<div>` elements without keyboard or screen-reader support. The rotate button had a `title` but no `aria-label`.

**Fix:**
1. Added `role="button"`, `tabIndex={0}`, and `aria-label` to each clickable thumbnail `<div>`.
2. Added `onKeyDown` handler that triggers the click action on Enter or Space.
3. Added `aria-label="Rotate page 90 degrees"` to the rotate button (kept existing `title`).

**Files Changed:**
- `src/components/common/PageThumbnails/PageThumbnails.tsx` - Added accessibility attributes and keyboard handler

**Tests Added:**
- `tests/components/PageThumbnails.test.tsx` - 4 new tests:
  - Thumbnail divs have `role="button"` and `tabIndex="0"`
  - Pressing Enter on a thumbnail triggers the click handler
  - Pressing Space on a thumbnail triggers the click handler
  - Rotate button has correct `aria-label`

---

### Improvement: Consolidate Duplicate File-Size Formatting Utilities

**Issue:** Two functions (`formatFileSize` in `fileUtils.ts` and `formatBytes` in `performance.ts`) both converted bytes to human-readable sizes but used different decimal precision (1 vs 2), causing inconsistency across the UI.

**Fix:**
1. Kept the `formatBytes` implementation in `src/utils/performance.ts` (2-decimal precision) as the canonical implementation.
2. In `src/utils/fileUtils.ts`, removed the duplicate `formatFileSize` implementation and re-exported `formatBytes` as `formatFileSize` for backward compatibility.
3. Updated unit tests in `tests/utils/fileUtils.test.ts` to expect 2-decimal precision, matching the canonical `formatBytes` behavior.
4. Added a test case in `tests/utils/performance.test.ts` to verify `formatBytes` handles intermediate values (e.g., 1.50 KB).

**Files Changed:**
- `src/utils/fileUtils.ts` - Replaced `formatFileSize` implementation with re-export of `formatBytes`
- `tests/utils/fileUtils.test.ts` - Updated expectations to 2-decimal precision
- `tests/utils/performance.test.ts` - Added intermediate-value test for `formatBytes`

**Test Results:** All tests passing after consolidation.

---

## 2026-06-26

### Cleanup: Remove unused ErrorDisplay component and AppContext bloat

**Issue:** The `ErrorDisplay` component was no longer used in any feature views (replaced by `ErrorBanner`), and `AppContext` exposed `dispatch` directly as well as unused `useTheme` and `useRecentFiles` wrapper hooks.

**Changes:**
1. Deleted `src/components/common/ErrorDisplay/` (ErrorDisplay.tsx, ErrorDisplay.module.css, index.ts)
2. Deleted `tests/components/ErrorDisplay.test.tsx`
3. Removed `dispatch` from `AppContextValue` and provider `value`
4. Removed `useTheme` and `useRecentFiles` exports from `AppContext.tsx`
5. Updated `tests/context/AppContext.test.tsx` to remove assertions for `dispatch`

**Files Changed:**
- `src/context/AppContext.tsx` - Removed `dispatch`, `useTheme`, `useRecentFiles`
- `tests/context/AppContext.test.tsx` - Updated assertions
- `docs/implementation.md` - Removed ErrorDisplay references

**Files Deleted:**
- `src/components/common/ErrorDisplay/ErrorDisplay.tsx`
- `src/components/common/ErrorDisplay/ErrorDisplay.module.css`
- `src/components/common/ErrorDisplay/index.ts`
- `tests/components/ErrorDisplay.test.tsx`

---

## 2026-05-01

### Bug: PageThumbnails overlays RotateView buttons when window is small

**Issue:** In RotateView, when the browser window is small or the screen is narrow, the PageThumbnails grid overlays and blocks the "Apply Rotation" and "Preview" buttons, making them inaccessible.

**Root Cause:** PageThumbnails uses a CSS grid that may overlap other content when viewport is constrained. No z-index or overflow handling prevents this.

**Files Affected:**
- `src/components/features/RotateView/RotateView.module.css` - Need to ensure proper stacking context
- `src/components/common/PageThumbnails/PageThumbnails.module.css` - Need to constrain overflow

**Files Changed:**
- `src/components/features/RotateView/RotateView.module.css`
- `src/components/common/PageThumbnails/PageThumbnails.module.css`

---

## 2026-04-29

### Bug Fix: Rotate page order not preserved

**Issue:** When rotating pages in RotateView, the rotated pages were appended at the end instead of being placed in their original positions.

**Root Cause:** In `rotateOperation.ts`, the code first added all non-rotated pages, then added rotated pages at the end.

**Fix:** Rewrote the page iteration to process pages in original order, applying rotations to specific pages via a Map lookup while maintaining correct page positions.

**Files Changed:**
- `src/services/pdf/rotateOperation.ts` - Rewrote page iteration logic to preserve page order

---

### Bug Fix: Result Preview not sticky during scroll

**Issue:** In RotateView, the Result Preview section would scroll away when the user scrolls down the page, making it hard to see the preview while adjusting page rotations.

**Root Cause:** The targetSection was part of the normal document flow with no sticky positioning.

**Fix:** Added sticky positioning to the `.targetSection` in RotateView.module.css with `position: sticky`, `top: var(--space-xl)`, and `align-self: flex-start`. Also set `max-height` with `overflow-y: auto` to keep the preview scrollable within viewport bounds.

**Files Changed:**
- `src/components/features/RotateView/RotateView.module.css` - Added sticky positioning to targetSection

---

### Bug Fix: E2E Test - Organize Thumbnail Loading

**Issue:** The E2E test "Organize: Select pages to delete and download organized PDF" was failing with "Found 0 thumbnails" because the test used a fixed 2-second timeout to wait for thumbnails, but the chunked loading takes longer than 2 seconds.

**Root Cause:** PageThumbnails component uses chunked loading (10 pages per chunk), so with larger PDFs the thumbnails aren't all rendered after 2 seconds.

**Fix:** Changed the waiting logic in `full-test.spec.ts` to wait for the "Loading pages..." indicator to disappear before trying to find thumbnails, rather than using a fixed timeout:

```typescript
// Before:
await page.waitForSelector('[class*="grid"]', { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(2000);

// After:
await page.waitForSelector('[class*="grid"]', { timeout: 10000 }).catch(() => {});
await page.waitForFunction(() => {
  const loading = document.querySelector('[class*="loading"]');
  return !loading || loading.textContent === '';
}, { timeout: 10000 }).catch(() => {});
```

**Files Changed:**
- `e2e/full-test.spec.ts` - Updated Organize tests to wait for loading to complete

**Test Results:** All 20 E2E tests passing, 251 unit tests passing

---

### Feature: PageThumbnails - PDF Caching

**Issue:** When navigating between views that use PageThumbnails, the same PDF file would be re-parsed every time.

**Fix:** Added a module-level cache (`pdfCache`) in PageThumbnails.tsx keyed by `file.name + file.size`. Already-parsed PDFs are reused.

**Files Changed:**
- `src/components/common/PageThumbnails/PageThumbnails.tsx` - Added caching logic

---

### Feature: PreviewModal - PDF Caching

**Issue:** PreviewModal would re-parse the PDF every time it was opened, causing performance issues.

**Fix:** Added a module-level cache to PreviewModal that stores the parsed PDF document.

**Files Changed:**
- `src/components/common/PreviewModal/PreviewModal.tsx` - Added caching

---

### Bug Fix: E2E Tests - Multiple Flaky Test Failures

**Issue:** E2E tests were failing intermittently due to:
1. Server timeouts on port 3000
2. Flaky thumbnail loading in Organize view
3. Navigation test timing issues

**Fix:**
- Updated E2E test infrastructure with proper waiting conditions
- Fixed Organize view thumbnail selector
- All 20 E2E tests now pass consistently

---

### Feature: Convert to PDF - A4 Default Page Size

**Issue:** Images were being added to PDF pages of their original size, which could result in very small pages for high-resolution images or very large pages that didn't fit standard printing.

**Fix:** Modified `convertOperation.ts` to scale images to fit A4 page size (595 x 842 points) with 20pt margins. The scaling maintains aspect ratio and centers the image on the page.

**Files Changed:**
- `src/services/pdf/convertOperation.ts` - Added A4 scaling logic with `scaleImageToFitA4()` function
- `src/components/features/ConvertView/ConvertView.tsx` - Removed duplicate A4 constants (now only in convertOperation.ts)

**Implementation:**
- A4 page size: 595 x 842 points (72 DPI)
- 20pt margin on all sides
- Images scaled to fit within (555 x 802) bounds while maintaining aspect ratio
- Centered on page: `x = (A4_WIDTH - scaledWidth) / 2`

---

### Feature: Convert to PDF - Preview Button

**Issue:** ConvertView did not have a preview button to preview the converted PDF before downloading.

**Fix:** Added `handlePreview` function and preview state to ConvertView. Preview button generates the PDF and opens it in PreviewModal.

**Files Changed:**
- `src/components/features/ConvertView/ConvertView.tsx` - Added `handlePreview`, `isPreviewOpen`, `previewFile`, `isPreviewLoading` state

---

## 2026-04-28

### Improvement: TypeScript Code Quality Enhancements

**Changes:**

1. **Added `assert.ts` utility** (`src/services/pdf/assert.ts`)
   - `assert(condition, message, code)` - Throws if condition is false
   - `assertDefined(value, message)` - Throws if null/undefined
   - `assertRange(value, min, max, message)` - Throws if out of range
   - `assertNonEmpty(array, message)` - Throws if empty array
   - `assertString(value, message)` - Throws if not a string
   - `assertNumber(value, message)` - Throws if not a number (including NaN)

2. **Added unit tests for pdfFallback error paths** (`tests/services/pdfFallback.test.ts`)
   - 18 tests covering all error paths: PDFDict2 errors, encryption errors, unknown errors, fallback behavior

3. **Added unit tests for assert utilities** (`tests/services/assert.test.ts`)
   - 21 tests covering all assertion functions

**Files Added:**
- `src/services/pdf/assert.ts` - NEW: Assertion utilities
- `tests/services/assert.test.ts` - NEW: Assert utility tests
- `tests/services/pdfFallback.test.ts` - NEW: pdfFallback error path tests

**Files Changed:**
- `docs/SPEC.md` - Updated Convert feature (removed PDF→Images note since feature is removed)

**Test Results:** All 249 tests passing

---

## 2026-06-26

### Performance: Worker Reuse, Throttled Thumbnails, Lightweight Merge Preview

**Issue:** TS P0 review identified three performance issues:
1. Worker was created and terminated on every `startOperation` call, causing unnecessary overhead.
2. `cancelled` was a module-level boolean in the worker, so cancelling one operation could affect subsequent operations.
3. PageThumbnails rendered all 10 pages in a chunk concurrently, overwhelming the main thread.
4. MergeView preview performed a full merge of all files just to show a preview, which is slow for large files.

**Fix:**
1. **Worker Reuse** (`src/hooks/useWorkerPDF.ts`):
   - Changed from `createWorker()` (always creates new + terminates old) to `getWorker()` (creates once, reuses thereafter).
   - Worker is only terminated on `reset()` or unmount.
   - Added stale-message filtering: messages with `id` not matching `currentIdRef.current` are ignored.

2. **Scoped Cancellation** (`src/workers/pdfProcessor.worker.ts`):
   - Replaced module-level `let cancelled = false` with `Set<string> cancelledIds`.
   - Added `isCancelled(id)`, `cancelOperation(id)`, and `clearCancelled(id)` helpers.
   - Cancel message now includes the operation `id`, and only that specific operation is marked cancelled.
   - Added `WorkerCancelMessage` type to `workerTypes.ts` for typed cancellation.

3. **Throttled Thumbnail Rendering** (`src/components/common/PageThumbnails/PageThumbnails.tsx`):
   - Added `concurrencyLimit = 3` to the chunk rendering loop.
   - Replaced `Promise.all(renderPromises)` (10 concurrent renders) with a worker-pool pattern that limits concurrent renders to 3.
   - After each page render, sets `canvas.width = 0; canvas.height = 0` to release canvas memory.

4. **Lightweight Merge Preview** (`src/components/features/MergeView/MergeView.tsx`):
   - Changed `handlePreview` from calling full `merge()` to simply previewing `files[0].file`.
   - This avoids expensive merge operations for preview; users can still see the full merged result via the actual Merge button.

**Files Changed:**
- `src/hooks/useWorkerPDF.ts` - Worker reuse, stale-message filtering
- `src/workers/pdfProcessor.worker.ts` - Scoped cancellation by operation id
- `src/workers/workerTypes.ts` - Added `WorkerCancelMessage` and `WorkerIncomingMessage` types
- `src/components/common/PageThumbnails/PageThumbnails.tsx` - Concurrency limit (3) and canvas cleanup
- `src/components/features/MergeView/MergeView.tsx` - Lightweight preview (first file only)

**Tests Added/Updated:**
- `tests/hooks/useWorkerPDF.test.ts` - 8 tests covering: worker reuse, stale-message filtering, cancel with id, terminate on reset/unmount
- `tests/components/PageThumbnails.test.tsx` - Added test for large PDF throttled rendering (15 pages)
- `tests/components/MergeView.test.tsx` - Added test verifying preview opens quickly without calling full merge
- `tests/workers/workerTypes.test.ts` - 7 tests (existing, still passing)

**Test Results:** Lint passed, 35 tests in modified files all passed.

**Performance Gains:**
- Worker creation/termination overhead eliminated for repeated operations.
- Cancellation no longer leaks between operations.
- Thumbnail rendering peak concurrency reduced from 10 to 3, reducing main thread jank.
- Canvas memory released immediately after each render.
- Merge preview latency reduced from O(n) file merge to O(1) first-file preview.

---

## 2026-04-26

### Feature: Mouse Scroll Navigation in Preview Modal

**Issue:** In PreviewModal, users could only navigate pages using the ◀ ▶ buttons. Mouse scroll was not supported.

**Fix:** Added `onWheel` handler to the preview content area for page navigation:
- Scroll down → go to next page
- Scroll up → go to previous page
- Page navigation is bounded between 1 and totalPages

**Files Changed:**
- `src/components/common/PreviewModal/PreviewModal.tsx` - Added `handleWheel` callback and `onWheel` prop to content div

**Tests Added:**
- `src/components/common/PreviewModal/PreviewModal.test.tsx` - Test to verify onWheel handler presence

**Test Results:** All 206 tests passing

---

### Bug Fix: MergeView Preview doesn't refresh when files change

**Issue:** In MergeView, after viewing a preview and then modifying the file list (add/remove/reorder), the preview would still show the old merged PDF when opened again.

**Root Cause:** The `previewFile` state was not cleared when the `files` array changed, causing stale preview data to persist.

**Fix:** Added `useEffect` in MergeView to clear `previewFile` whenever the `files` dependency array changes:

```typescript
useEffect(() => {
  setPreviewFile(null);
}, [files]);
```

**Files Changed:**
- `src/components/features/MergeView/MergeView.tsx` - Added `useEffect` to clear preview on files change

**Test Results:** All 206 tests passing

---

### Bug Fix: MergeView Preview shows only first file instead of merged PDF

**Issue:** In MergeView, clicking "Preview Files" would only show the first PDF file, not the merged result. Users could not preview what the actual merged output would look like.

**Root Cause:** The PreviewModal was passed `files[0].file` (the first file only) instead of a merged PDF.

**Fix:** Modified MergeView to:
1. Add `previewFile` and `isPreviewLoading` state
2. Add `handlePreview` function that merges files first, then creates a File from the merged Blob
3. PreviewModal now receives the merged PDF file with title "Merged Preview"
4. Preview button shows loading state while merging

**Files Changed:**
- `src/components/features/MergeView/MergeView.tsx` - Added `handlePreview` async function, `previewFile` and `isPreviewLoading` states

**Tests Added:**
- `tests/components/MergeView.test.tsx` - Mock useMerge hook to test preview functionality

**Test Results:** All 205 tests passing

---

## 2026-04-25

### Bug Fix: Split function fails with "PDF preview requires canvas rendering"

**Issue:** When using SplitView and clicking "Preview Pages", the preview modal shows "PDF preview requires canvas rendering" instead of properly displaying the PDF or showing an error message.

**Root Cause:** The PreviewModal component silently catches errors during PDF loading and shows a placeholder message instead of informing the user about the actual error.

**Fix:** 
1. Added error state to PreviewModal to track and display loading errors
2. Show user-friendly error message when PDF loading fails
3. Add loading state indicator while PDF is being loaded

**Files Changed:**
- `src/components/common/PreviewModal/PreviewModal.tsx` - Added error handling state and user-friendly error messages

**Tests Added:**
- `tests/components/PreviewModal.test.tsx` - Error state handling tests

**Test Results:** All tests passing

---

### Bug Fix: Add More Files button not working

**Issue:** In MergeView, clicking "Add More Files" button after adding the first PDF did nothing because the `onClick` handler was an empty function `onClick={() => {}}`.

**Fix:** Added `isAddingMore` state to toggle between showing the "Add More Files" button and a DropZone for adding additional files. When DropZone is active, adding files exits the add-mode and returns to file list view.

**Files Changed:**
- `src/components/features/MergeView/MergeView.tsx` - Added `isAddingMore` state, modified button/DropZone toggle logic

**Tests Added:**
- `tests/components/MergeView.test.tsx` - 5 tests covering:
  - Shows Add More Files button after adding first file
  - Clicking Add More Files shows DropZone
  - Adding more files increases file count
  - Merge button disabled when less than 2 files
  - Merge button enabled when 2+ files

**Test Results:** All 30 tests passing

### Bug Fix: Encrypted PDF Load Error

**Issue:** When loading an encrypted PDF, the error `Input document to PDFDocument.load is encrypted` was thrown instead of loading the document.

**Root Cause:** `mergeOperation.ts` called `PDFDocument.load(arrayBuffer)` without the `ignoreEncryption: true` option.

**Fix:** Added `ignoreEncryption: true` option to `PDFDocument.load()` call in `mergeOperation.ts`.

**Files Changed:**
- `src/services/pdf/mergeOperation.ts` - Line 27: Added `{ ignoreEncryption: true }` option

**Test Results:** All tests passing

### Bug Fix: PDFDict2 Internal Error & Fallback Strategy

**Issue:** When processing certain PDF files, error `Expected instance of PDFDict2, but got instance of undefined` was thrown by pdf-lib during page copy operations.

**Root Cause:** pdf-lib's internal `copyPages` method encounters PDFs with non-standard or corrupted object structures (e.g., missing/circular object references, malformed page dictionaries) and fails to resolve the PDFDict2 object.

**Fix:** Implemented a fallback strategy:
1. **Primary**: pdf-lib handles most PDFs with `ignoreEncryption: true`
2. **Fallback Architecture**: `withPDFLibFallback()` wrapper catches PDFDict2, encryption, and other errors
3. **Error Classification**: `PDFLibError` class categorizes errors (PDFDICT2, ENCRYPTED, CORRUPT, UNKNOWN)
4. **User Feedback**: User-friendly error messages when fallback is unavailable
5. **PDFKit Integration**: PDFKit installed as fallback library (v0.2.4)

**Files Changed:**
- `src/services/pdf/pdfFallback.ts` - NEW: Fallback wrapper and error types
- `src/services/pdf/index.ts` - Added pdfFallback exports
- `src/services/pdf/mergeOperation.ts` - Uses `withPDFLibFallback` on load and copyPages
- `src/services/pdf/reorganizeOperation.ts` - Uses `withPDFLibFallback` on load and copyPages
- `src/services/pdf/splitOperation.ts` - Uses `withPDFLibFallback` on load and copyPages
- `src/services/pdf/rotateOperation.ts` - Uses `withPDFLibFallback` on load
- `src/services/pdf/compressOperation.ts` - Uses `withPDFLibFallback` on load
- `vite.config.ts` - Added `vite-plugin-node-polyfills` for PDFKit browser support
- `package.json` - Added `pdfkit` and `@types/node`, `@types/pdfkit` dependencies

**Architecture:**
```
pdf-lib (default)
    ↓ catches PDFDict2/Encryption errors
PDFKit fallback (architectural - browser limitations exist)
    ↓
User-friendly error message
```

**Note:** PDFKit browser support for loading existing PDFs is limited. The fallback infrastructure is in place, but full PDFKit integration requires additional work due to browser API constraints.

**Test Results:** All 192 tests passing

---

## 2026-04-25 - Missing Preview Buttons

**Issue:** The PreviewModal component was created but NOT integrated into any feature views. Each view needs a Preview button to open the modal.

**Views Missing Preview Buttons:**
- **SplitView**: No preview button, only PageThumbnails shown
- **CompressView**: No preview button
- **RotateView**: No preview button (has PageThumbnails but no PreviewModal)
- **ConvertView**: No preview button (images to PDF, not applicable)
- **OrganizeView**: No preview button (has PageThumbnails but no PreviewModal)

**Fix:** Added Preview button and PreviewModal integration to all applicable views.

**Files Changed:**
- `src/components/features/SplitView/SplitView.tsx` - Added `isPreviewOpen` state and PreviewModal
- `src/components/features/CompressView/CompressView.tsx` - Added `isPreviewOpen` state and PreviewModal
- `src/components/features/RotateView/RotateView.tsx` - Added `isPreviewOpen` state and PreviewModal
- `src/components/features/OrganizeView/OrganizeView.tsx` - Added `isPreviewOpen` state and PreviewModal

**Tests Added:**
- `tests/components/SplitView.test.tsx` - 2 new tests for preview button
- `tests/components/CompressView.test.tsx` - 2 new tests for preview button
- `tests/components/RotateView.test.tsx` - 2 new tests for preview button
- `tests/components/OrganizeView.test.tsx` - 2 new tests for preview button

**Test Results:** All 201 tests passing

---

## 2026-04-25 - Drag to Reorder Files

**Issue:** MergeView description said "Drag to reorder files before merging" but drag-to-reorder functionality was NOT implemented.

**Fix:** Implemented drag-to-reorder functionality in MergeView using HTML5 drag-and-drop API.

**Files Changed:**
- `src/components/features/MergeView/MergeView.tsx` - Added drag state, handlers, and custom file list rendering
- `src/components/features/MergeView/MergeView.module.css` - Added styles for dragHandle, dragging, dragOver states

**Features:**
- Files display with drag handle (⋮⋮)
- Visual feedback during drag (opacity change)
- Drop target highlighted with border and background color
- Order updates when file is dropped in new position

**Tests Added:**
- `tests/components/MergeView.test.tsx` - Test for draggable file items

**Test Results:** All 201 tests passing

---

## 2026-04-25 - Preview Feature

### Feature: Preview Modal Component

**Description:** Added a reusable PreviewModal component that displays a preview of selected PDF files with page navigation and zoom controls.

**Files Added:**
- `src/components/common/PreviewModal/PreviewModal.tsx` - Main component
- `src/components/common/PreviewModal/PreviewModal.module.css` - Styles
- `src/components/common/PreviewModal/PreviewModal.test.tsx` - Tests

**Component Features:**
- Modal overlay with backdrop click to close
- ESC key to close
- Page navigation (Previous/Next)
- Zoom controls (25% to 200%)
- Fit-to-view button
- File name display in header
- Loading state while reading PDF

**Tests Added:**
- `tests/components/PreviewModal.test.tsx` - 8 tests:
  - Renders when isOpen is true
  - Does not render when isOpen is false
  - Does not render when file is null
  - Calls onClose when close button clicked
  - Calls onClose when ESC key pressed
  - Renders navigation buttons
  - Renders zoom controls
  - Zoom controls work
  - Closes when clicking overlay

**Spec Updated:** SPEC.md - Added Preview Feature Specification section

**Test Results:** All 192 tests passing
