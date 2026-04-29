# Changelog / Bug Fixes

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

4. **Updated SPEC.md** - Clarified that PDF→Images conversion is NOT YET IMPLEMENTED (requires backend service since pdf-lib cannot render PDFs to images client-side)

**Files Added:**
- `src/services/pdf/assert.ts` - NEW: Assertion utilities
- `tests/services/assert.test.ts` - NEW: Assert utility tests
- `tests/services/pdfFallback.test.ts` - NEW: pdfFallback error path tests

**Files Changed:**
- `docs/SPEC.md` - Updated Convert feature to clarify PDF→Images is not implemented

**Test Results:** All 249 tests passing

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