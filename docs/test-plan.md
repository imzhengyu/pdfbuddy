# Test Coverage Plan: PDF Tool 95%+ Coverage

## Context
Current test coverage is unknown but significantly below 95%. Existing tests cover only Button, DropZone, MergeView (partially), fileUtils, downloadUtils, and ClientPDFService (partially). Missing: all hooks, errorUtils, AppContext, SplitView, CompressView, RotateView, ConvertView, OrganizeView.

**Status Update**: Unit test phases 1-4 are complete (205 tests passing). Phase 6 E2E testing in progress with 8 basic tests passing, needs comprehensive workflow tests.

## Goal
>95% code coverage by writing comprehensive tests for all untested components and expanding existing tests.

## Test Cases by File

### 1. errorUtils.test.ts
**Source**: `src/utils/errorUtils.ts` (3 functions)

| Function | Test Cases |
|----------|------------|
| `getErrorMessage` | PDFProcessingError → message, Error → message, string → string, null → default, unknown → default |
| `getRecoverySuggestion` | PDFProcessingError with recovery → string, no recovery → undefined, Error → undefined |
| `isRetryable` | PROCESSING code → true, other code → false, Error → false |

### 2. AppContext.test.tsx
**Source**: `src/context/AppContext.tsx` (reducer + hook)

| Test | Cases |
|------|-------|
| reducer SET_VIEW | returns new state with updated view |
| reducer RESET | returns initial state |
| reducer default | returns state unchanged |
| useApp throws | outside provider throws error |
| useApp returns | { state, dispatch, setView } |

### 3. useSplit.test.ts
**Source**: `src/hooks/useSplit.ts`

| Test | Cases |
|------|-------|
| split called | with file and pageRanges |
| empty ranges | sets error, returns null |
| isProcessing | false → true → false |
| progress | null → {current,total,percent} → null |
| error handling | err.message set |
| clearError | clears error state |

### 4. FileList.test.tsx
**Source**: `src/components/common/FileList/FileList.tsx`

| Test | Cases |
|------|-------|
| renders empty | with empty files array |
| renders with files | shows file name, size |
| shows index | 1-based index display |
| showPageCount | when true shows pages, when false hides |
| onRemove called | when Remove button clicked |

### 5. SplitView.test.tsx, CompressView.test.tsx, RotateView.test.tsx, ConvertView.test.tsx, OrganizeView.test.tsx
Each feature component tests:
- DropZone accepts file → state updates
- Page range/quality selection works
- Action button disabled when no file
- Action button enabled when ready
- Processing shows progress
- Error displays and clears
- Clear resets state

---

## Execution Order

### Phase 1: Utils & Context
- [x] `tests/utils/errorUtils.test.ts`
- [x] `tests/context/AppContext.test.tsx`

### Phase 2: Hooks
- [x] `tests/hooks/useSplit.test.ts`
- [x] `tests/hooks/useCompress.test.ts`
- [x] `tests/hooks/useRotate.test.ts`
- [x] `tests/hooks/useConvert.test.ts`
- [x] `tests/hooks/useOrganize.test.ts`
- [x] `tests/hooks/useMerge.test.ts` (expand existing)

### Phase 3: Common Components
- [x] `tests/components/FileList.test.tsx`
- [x] `tests/components/PageThumbnails.test.tsx`
- [x] `tests/components/ProgressBar.test.tsx`

### Phase 4: Feature Components
- [x] `tests/components/SplitView.test.tsx`
- [x] `tests/components/CompressView.test.tsx`
- [x] `tests/components/RotateView.test.tsx`
- [x] `tests/components/ConvertView.test.tsx`
- [x] `tests/components/OrganizeView.test.tsx`

### Phase 5: E2E Comprehensive Testing
**Source**: `e2e/full-test.spec.ts` - Comprehensive user workflow tests

**Status**: Basic upload tests passing (8/10). Need to add full workflow tests (merge actual download, split ranges, rotate interactions, etc.)

| Feature | Test Cases | Status |
|---------|------------|--------|
| **Merge** | Upload 3 files → click Merge → verify download, reorder, remove | ❌ Not done |
| **Split** | Upload PDF → enter ranges → click Split → verify output | ✅ Basic done |
| **Compress** | Upload PDF → select quality → click Compress → verify download | ❌ Not done |
| **Rotate** | Upload PDF → rotate 90° → 180° → download | ❌ Not done |
| **Convert** | Upload images → convert → verify PDF | ❌ Not done |
| **Organize** | Upload PDF → reorder thumbnails → download | ❌ Not done |
| **Preview** | Open modal → navigate → zoom → close | ✅ Done |
| **Navigation** | Click each nav button → verify view changes | ✅ Done |
| **Add More Files** | Add file → click Add More → add more | ✅ Done |

---

## E2E Test Scenarios (Detailed)

### Merge Feature
1. Upload merge-1.pdf, merge-2.pdf, merge-3.pdf
2. Verify all 3 files appear in list with correct names and sizes
3. Drag file 3 to position 1 (reorder)
4. Click "Merge 3 Files" button
5. Verify processing completes and download triggers

### Split Feature
1. Upload split-source.pdf (5 pages)
2. Enter page ranges: "1-2, 3-4, 5"
3. Click "Split PDF" button
4. Verify 3 output files are generated
5. Invalid range "10-20" should show error

### Compress Feature
1. Upload test-5pages.pdf
2. Select "Low Quality" compression
3. Click "Compress PDF" button
4. Verify compressed file downloads

### Rotate Feature
1. Upload rotate-test.pdf
2. Click "Rotate 90°" button
3. Verify preview shows rotated page
4. Click "Rotate 180°" button
5. Verify preview updates
6. Click "Download Rotated PDF"

### Convert Feature
1. Upload test-1page.pdf, test-2pages.pdf (as images)
2. Click "Convert to PDF"
3. Verify single PDF with 3 pages total downloads

### Organize Feature
1. Upload test-3pages.pdf
2. See 3 page thumbnails
3. Drag page 3 to position 1
4. Click "Download Organized PDF"
5. Verify output has reordered pages

### Preview Modal
1. In Merge, upload merge-1.pdf
2. Click "Preview Files" button
3. Modal opens showing page 1 of 2
4. Click ▶ to go to page 2
5. Click zoom in (+), verify scale increases
6. Press ESC to close modal

### Error Recovery
1. Navigate to Split
2. Upload a corrupted/invalid file
3. Verify error message "Error loading PDF" or similar
4. Click × to clear error
5. Verify state resets to initial

---

### Phase 6: Verification
- [x] Run `npm run test:coverage` - 205 tests passing
- [x] Run `npm run test:e2e` - 8 basic tests passing
- [ ] Add comprehensive E2E workflow tests (Phase 5)
- [ ] Fix remaining E2E gaps

---

## Comprehensive E2E Test Plan

### File Structure
```
e2e/full-test.spec.ts   - Main E2E test suite (to be expanded)
test-pdfs/              - 10 test PDF files for testing
```

### Test PDFs Created
**IMPORTANT**: Test PDF files must be visually distinguishable from each other to verify correct files are merged/processed in the correct order. Use distinct background colors and bold fonts.

| File | Pages | Purpose | Visual Distinction |
|------|-------|---------|-------------------|
| test-1page.pdf | 1 | Basic single page | Yellow background, bold "TEST PAGE 1" |
| test-2pages.pdf | 2 | Two page document | Green background, bold "TEST PAGE" |
| test-3pages.pdf | 3 | Three page document | Blue background, bold "TEST PAGE" |
| test-5pages.pdf | 5 | Multi-page for compress | Orange background, bold "TEST PAGE" |
| test-10pages.pdf | 10 | Large document | Purple background, bold "TEST PAGE" |
| merge-1.pdf | 2 | Merge source 1 | Red background, bold "MERGE FILE 1" |
| merge-2.pdf | 3 | Merge source 2 | Pink background, bold "MERGE FILE 2" |
| merge-3.pdf | 1 | Merge source 3 | Cyan background, bold "MERGE FILE 3" |
| split-source.pdf | 5 | Split source (5 pages) | Gray background, bold "SPLIT SOURCE" |
| rotate-test.pdf | 3 | Rotate source (3 pages) | White background, bold "ROTATE TEST" |

---

### E2E Test Cases by Feature

#### MERGE (❌ Not Complete)
```
Test 1: Basic Merge
  1. Navigate to Merge view
  2. Upload merge-1.pdf, merge-2.pdf, merge-3.pdf
  3. Verify all 3 files appear with correct names
  4. Verify Merge button shows "Merge 3 Files" and is enabled
  5. Click Merge
  6. Verify download triggers with filename "merged.pdf"

Test 2: Drag to Reorder
  1. Upload merge-1.pdf, merge-2.pdf, merge-3.pdf
  2. Verify file order: merge-1, merge-2, merge-3
  3. Drag file 3 to position 1 (before file 1)
  4. Verify new order: merge-3, merge-1, merge-2
  5. Click Merge
  6. Verify download triggers

Test 3: Remove File
  1. Upload merge-1.pdf, merge-2.pdf, merge-3.pdf
  2. Click Remove on merge-2.pdf
  3. Verify only merge-1 and merge-3 remain
  4. Verify Merge button shows "Merge 2 Files"

Test 4: Add More Files
  1. Upload merge-1.pdf
  2. Click "Add More Files" button
  3. Upload merge-2.pdf
  4. Verify merge-1 and merge-2 both present
  5. Merge button should be disabled (need 2+ files) → enabled after 2nd file

Test 5: Clear All
  1. Upload merge-1.pdf, merge-2.pdf, merge-3.pdf
  2. Click "Clear All" button
  3. Verify all files removed
  4. Verify dropzone reappears
```

#### SPLIT (⚠️ Partial - Page Range Input Not Tested)
```
Test 6: Basic Split with Page Ranges
  1. Navigate to Split view
  2. Upload split-source.pdf (5 pages)
  3. Verify "5 pages" text visible
  4. Enter page ranges: "1-2, 3-4, 5"
  5. Click "Split PDF" button
  6. Verify 3 output files download

Test 7: Invalid Page Range Error
  1. Upload split-source.pdf
  2. Enter invalid range "10-20"
  3. Click "Split PDF" button
  4. Verify error message appears

Test 8: Empty Page Range
  1. Upload split-source.pdf
  2. Leave page range input empty
  3. Verify Split button is disabled
```

#### COMPRESS (❌ Not Complete)
```
Test 9: Compress with Quality Selection
  1. Navigate to Compress view
  2. Upload test-5pages.pdf
  3. Verify file appears
  4. Select "Low Quality" radio button
  5. Click "Compress PDF" button
  6. Verify download triggers with compressed file

Test 10: Compress Medium Quality
  1. Upload test-5pages.pdf
  2. Select "Medium Quality" radio button
  3. Click "Compress PDF" button
  4. Verify download triggers

Test 11: Compress High Quality
  1. Upload test-5pages.pdf
  2. Select "High Quality" radio button
  3. Click "Compress PDF" button
  4. Verify download triggers
```

#### ROTATE (❌ Not Complete)
```
Test 12: Rotate 90 Degrees
  1. Navigate to Rotate view
  2. Upload rotate-test.pdf (3 pages)
  3. Verify page thumbnails appear
  4. Click "Rotate 90°" button
  5. Verify preview updates to show rotation

Test 13: Rotate 180 Degrees
  1. Upload rotate-test.pdf
  2. Click "Rotate 180°" button
  3. Verify preview updates

Test 14: Download Rotated PDF
  1. Upload rotate-test.pdf
  2. Click "Rotate 90°"
  3. Click "Download Rotated PDF" button
  4. Verify download triggers with rotated file
```

#### CONVERT (❌ Not Complete)
```
Test 15: Convert PDF Pages to PDF
  1. Navigate to Convert view
  2. Upload test-1page.pdf
  3. Verify file appears
  4. Click "Convert to PDF" button
  5. Verify download triggers

Test 16: Convert Multiple Files
  1. Upload test-1page.pdf, test-2pages.pdf
  2. Click "Convert to PDF" button
  3. Verify single output PDF downloads
```

#### ORGANIZE (❌ Not Complete)
```
Test 17: Reorder Pages via Drag
  1. Navigate to Organize view
  2. Upload test-3pages.pdf (3 pages)
  3. Verify 3 page thumbnails visible
  4. Drag page 3 to position 1
  5. Verify page order updates in preview

Test 18: Download Organized PDF
  1. Upload test-3pages.pdf
  2. Optionally reorder pages
  3. Click "Download Organized PDF" button
  4. Verify download triggers
```

#### PREVIEW MODAL (✅ Done - Basic)
```
Test 19: Preview Navigation
  1. In Merge, upload merge-1.pdf (2 pages)
  2. Click "Preview Files" button
  3. Verify modal opens
  4. Verify "Page 1 of 2" visible
  5. Click ▶ (Next page) button
  6. Verify "Page 2 of 2" visible
  7. Click ◀ (Previous page) button
  8. Verify "Page 1 of 2" visible again

Test 20: Preview Zoom
  1. Open preview modal
  2. Verify zoom level shows "100%"
  3. Click "+" (Zoom in) button
  4. Verify zoom level shows "125%"
  5. Click "-" (Zoom out) button
  6. Verify zoom level shows "100%"

Test 21: Close Modal with ESC
  1. Open preview modal
  2. Press ESC key
  3. Verify modal closes

Test 22: Close Modal with X Button
  1. Open preview modal
  2. Click × close button
  3. Verify modal closes
```

#### NAVIGATION (✅ Done)
```
Test 23: All Navigation Buttons
  1. Click Merge → verify heading "Merge PDFs"
  2. Click Split → verify heading "Split PDF"
  3. Click Compress → verify heading "Compress PDF"
  4. Click Rotate → verify heading "Rotate PDF"
  5. Click Convert → verify heading "Convert to PDF"
  6. Click Organize → verify heading "Organize PDF"

Test 24: Active State Highlighted
  1. Click Split button
  2. Verify Split button has [active] styling
  3. Click Compress button
  4. Verify Compress button has [active] styling
  5. Verify Split button no longer has [active]
```

---

## Current Status Summary

| Category | Tests | Passing |
|----------|-------|---------|
| Unit Tests (Phase 1-4) | 205 | ✅ 205 |
| E2E Basic (Phase 5) | 8 | ✅ 8 |
| E2E Comprehensive (Phase 5 - to add) | ~22 | ❌ 0 |

**Next Action**: Implement remaining E2E tests from the plan above