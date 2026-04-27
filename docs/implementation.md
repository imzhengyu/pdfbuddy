# Implementation Plan

> **Based on:** SPEC.md (Last Updated: 2026-04-26)

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
| `MergeView` | ✅ Done | Merge multiple PDFs |
| `SplitView` | ✅ Done | Split with visual/range modes |
| `CompressView` | ✅ Done | Compress with quality picker |
| `RotateView` | ✅ Done | Rotate/mirror transformations |
| `ConvertView` | ✅ Done | Images→PDF conversion |
| `OrganizeView` | ✅ Done | Delete pages (drag-reorder not implemented) |

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

Using React Context + useReducer for global state:

```
src/contexts/
├── MergeContext.tsx
├── SplitContext.tsx
├── CompressContext.tsx
├── RotateContext.tsx
├── ConvertContext.tsx
└── OrganizeContext.tsx
```

---

## File Structure

```
pdf-tool/
├── docs/
│   ├── SPEC.md              # Feature specification
│   ├── implementation.md    # This file
│   └── test-plan.md         # Test documentation
├── src/
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
│   │   ├── mergeOperation.ts
│   │   ├── splitOperation.ts
│   │   ├── compressOperation.ts
│   │   ├── rotateOperation.ts
│   │   ├── convertOperation.ts
│   │   └── reorganizeOperation.ts
│   ├── hooks/
│   │   ├── useMerge.ts
│   │   ├── useSplit.ts
│   │   ├── useCompress.ts
│   │   ├── useRotate.ts
│   │   ├── useConvert.ts
│   │   └── useOrganize.ts
│   └── contexts/
│       └── (contexts per feature)
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

## Success Criteria Checklist

- [x] All 6 features implemented with client-side processing
- [x] PreviewModal works on all feature views
- [x] Drag and drop reliable for all file operations
- [x] Files up to 20MB process without crashing
- [x] E2E tests pass for all core workflows
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Responsive on mobile (320px+), tablet, desktop
