# PDF Tool - Specification

> **Last Updated:** 2026-04-25

## Overview

A colorful, friendly React web app for PDF manipulation with client-side processing and modular service architecture.

## Features

### 1. Merge PDFs
- Drag and drop multiple PDF files
- Reorder files before merging
- Preview page count per file
- Progress indicator during processing
- Download merged PDF

### 2. Split PDF
- Select single PDF file
- Choose split mode:
  - By page ranges (e.g., "1-3, 4-6, 7-end")
  - Extract specific pages
  - Split into individual pages
- **Preview pages before splitting** ← NEW
- Download split PDFs (as ZIP for multiple files)

### 3. Compress PDF
- Select single PDF file
- Choose compression quality:
  - **Low** - Maximum compression, lower quality
  - **Medium** - Balanced (default)
  - **High** - Minimum compression, best quality
- **Preview file before/after compression** ← NEW
- Show size reduction percentage
- Download compressed PDF

### 4. Rotate PDF
- Select single PDF file
- Visual page thumbnails
- Click to rotate individual pages (90° increments)
- **Preview button to see full PDF preview** ← NEW
- Download rotated PDF

### 5. Convert
- **PDF to Images**: Select PDF, **preview pages**, choose format (PNG/JPEG), download images (ZIP) ← NEW
- **Images to PDF**: Select images, reorder, download PDF
- Support drag and drop for multiple images

### 6. Organize PDF
- Select single PDF file
- Visual page thumbnails in grid
- Drag to reorder pages
- Select and delete pages
- **Preview button to view full PDF** ← NEW
- Download reorganized PDF

---

## Preview Feature Specification

### Overview

Each feature view must display a **Preview Box** after a PDF file is selected. This provides users with a visual confirmation of their document before processing.

### Preview Box UI

```
┌─────────────────────────────────────────┐
│  📄 Preview                            │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     [PDF Page Thumbnail]        │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Page: 1 / 5          ◀ ▶  [Expand]    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Full Preview (Modal)          │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Preview Button Behavior

| View | Button Label | Action |
|------|--------------|--------|
| Merge | "Preview Files" | Shows file list with page counts |
| Split | "Preview Pages" | Opens page thumbnail grid |
| Compress | "Preview" | Shows before/after size comparison |
| Rotate | "Preview PDF" | Opens full PDF preview modal |
| Convert | "Preview" | Shows image/PDF preview |
| Organize | "Preview" | Opens full PDF preview modal |

### Preview Modal (Expand View)

- Full-screen modal overlay
- Renders PDF pages with pdf-lib or canvas
- Navigation: Previous/Next page buttons
- Zoom controls: Fit, 50%, 100%, 150%
- Close button (X) and ESC key to dismiss

### Component Changes

#### New Component: `PreviewModal`

```
src/components/common/PreviewModal/
├── PreviewModal.tsx
├── PreviewModal.module.css
└── PreviewModal.test.tsx
```

**Props:**
```typescript
interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  title?: string;
}
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 |
| PDF Processing | pdf-lib |
| Drag & Drop | react-dropzone |
| State | React Context + useReducer |
| Styling | CSS Modules + CSS Variables |
| Build | Vite |
| Testing | Vitest + React Testing Library |
| E2E Testing | Playwright |

---

## UI Design

### Color Palette

```css
--color-primary: #6366f1;      /* Indigo */
--color-secondary: #f472b6;    /* Pink */
--color-accent: #22d3ee;       /* Cyan */
--color-success: #34d399;      /* Green */
--color-warning: #fbbf24;      /* Amber */
--color-error: #f87171;       /* Red */
--color-background: #f8fafc;  /* Light gray */
--color-surface: #ffffff;      /* White */
--color-text: #1e293b;         /* Dark slate */
```

---

## Testing Requirements

### Preview Modal Tests

| Test Case | Description |
|----------|-------------|
| Renders when isOpen is true | Modal should display content |
| Does not render when isOpen is false | Modal should be hidden |
| Calls onClose when close button clicked | Close handler invoked |
| Calls onClose when ESC key pressed | Close handler invoked |
| Displays file name in header | Shows filename |
| Page navigation works | Next/Previous buttons functional |
| Zoom controls work | Zoom in/out functions |

### Integration Tests for Preview

| View | Test |
|------|------|
| SplitView | Click Preview → Modal opens → Close works |
| CompressView | Click Preview → Shows file info |
| RotateView | Click Preview → Modal opens with PDF pages |
| ConvertView | Click Preview → Shows image preview |
| OrganizeView | Click Preview → Modal opens with PDF pages |

---

## Success Criteria

- [x] All 6 features functional with client-side processing
- [x] Drag and drop works reliably
- [x] Files up to 20MB process without crashing
- [x] Unit tests achieve >80% coverage on service layer
- [ ] **Preview feature implemented on all views**
- [ ] **Preview modal component created and tested**
- [ ] E2E tests pass for core workflows
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Responsive on mobile (320px+), tablet, desktop

---

## File Structure

```
pdf-tool/
├── SPEC.md                          # This file
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── DropZone/
│   │   │   ├── FileList/
│   │   │   ├── PageThumbnails/
│   │   │   ├── PreviewModal/       # NEW
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
│   └── hooks/
│       ├── useMerge.ts
│       ├── useSplit.ts
│       ├── useCompress.ts
│       ├── useRotate.ts
│       ├── useConvert.ts
│       └── useOrganize.ts
└── tests/
    ├── components/
    │   └── PreviewModal.test.tsx   # NEW
    └── e2e/
        └── app.spec.ts
```
