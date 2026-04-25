# Changelog / Bug Fixes

## 2026-04-25

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