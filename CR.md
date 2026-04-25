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