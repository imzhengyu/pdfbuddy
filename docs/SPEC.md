# PDF Tool - Specification

> **Last Updated:** 2026-04-26

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
- Mouse scroll: down = next page, up = previous page
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

### Development Rules

**No CDN Dependencies:** Do NOT use CDN-based external dependencies. Always use local npm packages unless there is no other way to accomplish the requirement.

- Use npm packages installed locally via `npm install`
- If a library is not available as an npm package, evaluate if the feature is necessary
- Exception: CDN for worker scripts required by libraries (e.g., pdfjs-dist worker) is acceptable only when no local solution exists

**Lint Before Commit:** All commits must pass lint checks before being allowed to commit. A pre-commit hook runs `npm run lint` (TypeScript type checking via `tsc --noEmit`) before any commit is accepted. If lint fails, the commit is rejected.

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

## Success Criteria

- [x] All 6 features functional with client-side processing
- [x] Drag and drop works reliably
- [x] Files up to 20MB process without crashing
- [ ] Preview feature implemented on all views
- [ ] Preview modal component created and tested
- [ ] E2E tests pass for core workflows
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Responsive on mobile (320px+), tablet, desktop

---

## File Structure

```
pdf-tool/
├── SPEC.md                          # This file
├── test-plan.md                     # Test plan and coverage details
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
│   └── hooks/
│       ├── useMerge.ts
│       ├── useSplit.ts
│       ├── useCompress.ts
│       ├── useRotate.ts
│       ├── useConvert.ts
│       └── useOrganize.ts
```

---

## Test Documentation

All test-related documentation including unit tests, integration tests, E2E tests, test coverage goals, and test data specifications is located in:

**[test-plan.md](./test-plan.md)**

This includes:
- Unit test coverage plan (>95% goal)
- E2E comprehensive test scenarios
- Test PDF file requirements (visually distinguishable files)
- Integration test specifications
