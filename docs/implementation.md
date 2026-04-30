# Implementation Plan

> **Based on:** SPEC.md (Last Updated: 2026-04-29)

## Overview

This document outlines the implementation approach for the PDF Tool, following the modular architecture defined in SPEC.md.

## Implementation Order

### Phase 1: Common Components (Foundation)

| Component | Status | Description |
|-----------|--------|-------------|
| `DropZone` | ✅ Done | Drag and drop file handling |
| `PageThumbnails` | ✅ Done | PDF page thumbnail grid |
| `PreviewModal` | ✅ Done | Full PDF preview modal |
| `ProgressBar` | ✅ Done | Processing progress indicator |
| `FileList` | ✅ Done | File list with page counts |
| `Button` | ✅ Done | Reusable button component |

### Phase 2: PDF Services

| Service | Status | Description |
|---------|--------|-------------|
| `mergeOperation.ts` | ✅ Done | Merge multiple PDFs |
| `splitOperation.ts` | ✅ Done | Split PDF by selection/ranges |
| `compressOperation.ts` | ✅ Done | Compress with quality levels |
| `rotateOperation.ts` | ✅ Done | Rotate/mirror pages |
| `convertOperation.ts` | ✅ Done | Images→PDF conversion |
| `reorganizeOperation.ts` | ✅ Done | Reorder/delete pages |

### Phase 3: Feature Views

| View | Status | Description |
|------|--------|-------------|
| `MergeView` | ✅ Done | Merge multiple PDFs with drag-to-reorder |
| `SplitView` | ✅ Done | Split with visual/range modes |
| `CompressView` | ✅ Done | Compress with quality picker |
| `RotateView` | ✅ Done | Rotate/mirror transformations |
| `ConvertView` | ⚠️ Partial | Images→PDF done; PDF→Images TODO |
| `OrganizeView` | ⚠️ Partial | Page deletion done; drag-reorder TODO |

### Phase 4: Custom Hooks

| Hook | Status | Description |
|------|--------|-------------|
| `useMerge` | ✅ Done | Merge state management |
| `useSplit` | ✅ Done | Split state management |
| `useCompress` | ✅ Done | Compress state management |
| `useRotate` | ✅ Done | Rotate state management |
| `useConvert` | ✅ Done | Convert state management |
| `useOrganize` | ✅ Done | Organize state management |

---

## Component Implementation Details

### PreviewModal Component

**Location:** `src/components/common/PreviewModal/`

**Props:**
```typescript
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  title?: string;
}
```

**Features:**
- Full-screen modal with overlay
- PDF page rendering via pdf-lib/canvas
- Navigation: Previous/Next buttons
- Scroll: down = next page, up = previous page
- Zoom: Fit, 50%, 100%, 150%
- Close: X button + ESC key

### Feature View Common Patterns

Each feature view follows a consistent pattern:

1. **DropZone** for file selection
2. **PreviewModal** for document preview
3. **Action-specific UI** (thumbnails, controls, etc.)
4. **Download button** for result export

---

## State Management

Single `AppContext` for view routing (not per-feature contexts):

```
src/context/
└── AppContext.tsx    # View state only: { currentView: View }
```

Each feature view manages its own local state via hooks:
- `useMerge`, `useSplit`, `useCompress`, `useRotate`, `useConvert`, `useOrganize`

This is simpler than per-feature contexts and avoids over-architecture.

---

## File Structure

```
pdf-tool/
├── docs/
│   ├── SPEC.md              # Feature specification
│   ├── implementation.md    # This file
│   └── test-plan.md         # Test documentation
├── src/
│   ├── App.tsx              # Main app with view routing
│   ├── main.tsx             # Entry point
│   ├── context/
│   │   └── AppContext.tsx   # Single context for view state
│   ├── styles/
│   │   ├── variables.css    # CSS custom properties
│   │   └── global.css       # Global styles
│   ├── utils/
│   │   ├── downloadUtils.ts
│   │   ├── errorUtils.ts
│   │   └── fileUtils.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── DropZone/
│   │   │   ├── FileList/
│   │   │   ├── PageThumbnails/
│   │   │   ├── PreviewModal/
│   │   │   ├── ProgressBar/
│   │   │   └── Button/
│   │   └── features/
│   │       ├── MergeView/
│   │       ├── SplitView/
│   │       ├── CompressView/
│   │       ├── RotateView/
│   │       ├── ConvertView/
│   │       └── OrganizeView/
│   ├── services/pdf/
│   │   ├── types.ts
│   │   ├── index.ts
│   │   ├── ClientPDFService.ts
│   │   ├── pdfOperations.ts
│   │   ├── pdfValidation.ts
│   │   ├── pdfFallback.ts
│   │   ├── mergeOperation.ts
│   │   ├── splitOperation.ts
│   │   ├── compressOperation.ts
│   │   ├── rotateOperation.ts
│   │   ├── convertOperation.ts
│   │   └── reorganizeOperation.ts
│   └── hooks/
│       ├── useMerge.ts
│       ├── useSplit.ts
│       ├── useCompress.ts
│       ├── useRotate.ts
│       ├── useConvert.ts
│       └── useOrganize.ts
```

---

## Technology Notes

| Library | Usage | Notes |
|---------|-------|-------|
| `pdf-lib` | PDF manipulation | Client-side processing |
| `react-dropzone` | File drag/drop | For file selection |
| `vite` | Build tool | Dev server + production build |
| `vitest` | Unit testing | Component + service tests |
| `@playwright/test` | E2E testing | Cross-browser automation |

---

## Phase 5: Code Refactoring (Reduce Duplication)

> **Analysis Date:** 2026-04-30
> **Analysis Result:** Found 10 patterns with significant duplication across feature views

### Duplication Analysis Summary

| Pattern | Files Affected | Priority | Suggested Action |
|---------|---------------|----------|------------------|
| Custom Hook Pattern | All 6 hooks | **HIGH** | Create `usePDFOperation` factory |
| FileItem Interface | MergeView, ConvertView | **HIGH** | Move to shared types |
| handleFilesDropped | All 6 views | **HIGH** | Create `useFileHandler` hook |
| handleRemoveFile | MergeView, ConvertView | MEDIUM | Use FileList component |
| handleClear | MergeView, ConvertView, RotateView | MEDIUM | Extend useFileHandler |
| handlePreview | MergeView, ConvertView, SplitView | MEDIUM | Create `usePreview` hook |
| Error Display | All 6 views | **HIGH** | Use existing ErrorDisplay component |
| PDF Cache | PreviewModal, PageThumbnails | **HIGH** | Create `pdfDocumentCache` service |
| Drag Reorder | MergeView, OrganizeView | MEDIUM | Create `useDragReorder` hook |
| PageThumbnails Props | SplitView, RotateView, OrganizeView | LOW | Standardize prop interface |

---

### Refactoring Steps

#### Step 1: Consolidate PDF Cache Service
**Goal:** Create shared PDF document cache to replace duplicate caching code in PreviewModal and PageThumbnails.

**Files to Create:**
- `src/services/pdf/pdfCache.ts` - Shared PDFDocument cache class

**Files to Modify:**
- `src/components/common/PreviewModal/PreviewModal.tsx` - Use shared pdfCache
- `src/components/common/PageThumbnails/PageThumbnails.tsx` - Use shared pdfCache

**Success Criteria:**
- [ ] `pdfCache.ts` created with get/set/clear methods
- [ ] PreviewModal uses shared pdfCache
- [ ] PageThumbnails uses shared pdfCache
- [ ] Both components work identically after refactor
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 2: Use ErrorDisplay Component in All Views
**Goal:** Replace inline error markup in all 6 feature views with the existing ErrorDisplay component.

**Files to Modify:**
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/SplitView/SplitView.tsx`
- `src/components/features/CompressView/CompressView.tsx`
- `src/components/features/RotateView/RotateView.tsx`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/OrganizeView/OrganizeView.tsx`

**Success Criteria:**
- [ ] All 6 views import ErrorDisplay
- [ ] Inline error markup replaced with `<ErrorDisplay>`
- [ ] All views work identically after refactor
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 3: Create useFileHandler Hook
**Goal:** Consolidate file drop/remove/clear logic into a reusable hook.

**Files to Create:**
- `src/hooks/useFileHandler.ts` - Shared file handling hook

**Files to Modify:**
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/CompressView/CompressView.tsx`
- `src/components/features/SplitView/SplitView.tsx`
- `src/components/features/RotateView/RotateView.tsx`
- `src/components/features/OrganizeView/OrganizeView.tsx`

**Success Criteria:**
- [ ] `useFileHandler.ts` created with all file handling logic
- [ ] All 6 views use the shared hook
- [ ] File handling behavior unchanged
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 4: Create usePreview Hook
**Goal:** Consolidate preview modal state management into a reusable hook.

**Files to Create:**
- `src/hooks/usePreview.ts` - Shared preview management hook

**Files to Modify:**
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/ConvertView/ConvertView.tsx`
- `src/components/features/SplitView/SplitView.tsx`
- `src/components/features/CompressView/CompressView.tsx`
- `src/components/features/RotateView/RotateView.tsx`
- `src/components/features/OrganizeView/OrganizeView.tsx`

**Success Criteria:**
- [ ] `usePreview.ts` created with all preview state logic
- [ ] All 6 views use the shared hook
- [ ] Preview modal behavior unchanged
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 5: Create useDragReorder Hook
**Goal:** Consolidate drag-and-drop reorder logic into a reusable hook.

**Files to Create:**
- `src/hooks/useDragReorder.ts` - Shared drag reorder hook

**Files to Modify:**
- `src/components/features/MergeView/MergeView.tsx`
- `src/components/features/OrganizeView/OrganizeView.tsx`

**Success Criteria:**
- [ ] `useDragReorder.ts` created with all drag reorder logic
- [ ] MergeView and OrganizeView use the shared hook
- [ ] Drag reorder behavior unchanged
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 6: Create usePDFOperation Factory
**Goal:** Create a factory function to generate operation hooks, reducing ~250 lines of duplicate hook code.

**Files to Create:**
- `src/hooks/usePDFOperation.ts` - Hook factory

**Files to Modify:**
- `src/hooks/useMerge.ts` - Use factory
- `src/hooks/useSplit.ts` - Use factory
- `src/hooks/useCompress.ts` - Use factory
- `src/hooks/useRotate.ts` - Use factory
- `src/hooks/useConvert.ts` - Use factory
- `src/hooks/useOrganize.ts` - Use factory

**Success Criteria:**
- [ ] `usePDFOperation.ts` factory created
- [ ] All 6 hooks use the factory
- [ ] Hook behavior unchanged
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

#### Step 7: Create Shared Types File
**Goal:** Consolidate duplicated type definitions into a shared types file.

**Files to Create:**
- `src/types/common.ts` - Shared type definitions

**Files to Modify:**
- `src/components/features/MergeView/MergeView.tsx` - Use shared FileItem
- `src/components/features/ConvertView/ConvertView.tsx` - Use shared FileItem
- `src/components/common/FileList/FileList.tsx` - Use shared types

**Success Criteria:**
- [ ] `common.ts` created with FileItem and other shared types
- [ ] Duplicate type definitions removed
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass

**Status:** Not Started

---

### New File Structure After Refactoring

```
pdf-tool/
├── src/
│   ├── hooks/
│   │   ├── usePDFOperation.ts      # NEW: Hook factory
│   │   ├── useFileHandler.ts       # NEW: File handling hook
│   │   ├── usePreview.ts          # NEW: Preview modal hook
│   │   ├── useDragReorder.ts      # NEW: Drag reorder hook
│   │   ├── useMerge.ts            # Simplified using factory
│   │   ├── useSplit.ts            # Simplified using factory
│   │   ├── useCompress.ts         # Simplified using factory
│   │   ├── useRotate.ts           # Simplified using factory
│   │   ├── useConvert.ts          # Simplified using factory
│   │   └── useOrganize.ts         # Simplified using factory
│   ├── services/pdf/
│   │   ├── pdfCache.ts            # NEW: Shared PDF cache
│   │   ├── ...
│   ├── types/
│   │   ├── common.ts              # NEW: Shared types
│   │   ├── ...
│   └── components/
│       ├── common/
│       │   ├── ErrorDisplay/      # Already exists, use in views
│       │   ├── ...
│       └── features/
│           └── (views updated to use shared hooks)
```

---

### Refactoring Success Criteria

- [ ] All 7 refactoring steps complete
- [ ] All 251 unit tests pass
- [ ] All 20 E2E tests pass
- [ ] No duplicate code patterns remain (verified by subagent analysis)
- [ ] Code size reduced by estimated ~400 lines
- [ ] Maintainability improved (single source of truth for each pattern)

---

## Success Criteria Checklist

- [x] All 6 features implemented with client-side processing
- [x] PreviewModal works on all feature views
- [x] Drag and drop reliable for all file operations
- [x] Files up to 20MB process without crashing
- [x] E2E tests pass for all core workflows
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Responsive on mobile (320px+), tablet, desktop
