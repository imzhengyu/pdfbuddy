# PDF Tool - Specification

## Overview

A colorful, friendly React web app for PDF manipulation. All processing happens client-side using WebAssembly, with a modular service layer ready for future backend extension.

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 | UI framework |
| PDF Processing | pdf-lib | Client-side PDF manipulation |
| Drag & Drop | react-dropzone | File upload handling |
| State | React Context + useReducer | Global state management |
| Styling | CSS Modules + CSS Variables | Scoped, themeable styles |
| Build | Vite | Fast development + bundling |
| Testing | Vitest + React Testing Library | Unit + component tests |
| E2E Testing | Playwright | Full browser testing |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                          │
│  (React Components - MergeView, SplitView, etc.)       │
├─────────────────────────────────────────────────────────┤
│                   Feature Hooks                         │
│  (useMerge, useSplit, useCompress, etc.)               │
├─────────────────────────────────────────────────────────┤
│                Service Abstraction Layer                │
│  ┌─────────────────┐    ┌─────────────────────────┐   │
│  │  PDFService     │    │  BackendPDFService     │   │
│  │  (Client-side)  │    │  (Future extension)     │   │
│  └─────────────────┘    └─────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│                   PDF Engine                            │
│  (pdf-lib for client-side processing)                   │
└─────────────────────────────────────────────────────────┘
```

### Service Interface

```typescript
interface IPDFService {
  merge(files: File[]): Promise<Blob>;
  split(file: File, pageRanges: PageRange[]): Promise<Blob[]>;
  compress(file: File, quality: 'low' | 'medium' | 'high'): Promise<Blob>;
  rotate(file: File, rotations: PageRotation[]): Promise<Blob>;
  convertToPDF(images: File[]): Promise<Blob>;
  reorganize(file: File, newOrder: PageOrder[]): Promise<Blob>;
}
```

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
- Preview pages before splitting
- Download split PDFs (as ZIP for multiple files)

### 3. Compress PDF
- Select single PDF file
- Choose compression quality:
  - **Low** - Maximum compression, lower quality
  - **Medium** - Balanced (default)
  - **High** - Minimum compression, best quality
- Show size reduction percentage
- Download compressed PDF

### 4. Rotate PDF
- Select single PDF file
- Visual page thumbnails
- Click to rotate individual pages (90° increments)
- Download rotated PDF

### 5. Convert
- **Images to PDF**: Select images, reorder, download PDF
- Support drag and drop for multiple images

### 6. Organize PDF
- Select single PDF file
- Visual page thumbnails in grid
- Drag to reorder pages
- Select and delete pages
- Download reorganized PDF

## UI Design

### Color Palette
```css
--color-primary: #6366f1;      /* Indigo - main actions */
--color-secondary: #f472b6;    /* Pink - secondary actions */
--color-accent: #22d3ee;      /* Cyan - highlights */
--color-success: #34d399;      /* Green - success states */
--color-warning: #fbbf24;      /* Amber - warnings */
--color-error: #f87171;        /* Red - errors */
--color-background: #f8fafc;   /* Light gray - background */
--color-surface: #ffffff;      /* White - cards */
--color-text: #1e293b;         /* Dark slate - text */
```

### Layout
- **Header**: App title + navigation tabs (Merge, Split, Compress, Rotate, Convert, Organize)
- **Main Area**: Feature-specific workspace
- **Drop Zone**: Prominent drag-and-drop area when no file is selected
- **File Queue**: List of uploaded files with thumbnails and actions
- **Preview Panel**: Visual preview of pages (for applicable features)
- **Action Bar**: Primary action buttons (Process, Download, Clear)

### Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── DropZone/
│   │   ├── FileList/
│   │   ├── PageThumbnails/
│   │   ├── ProgressBar/
│   │   └── Button/
│   └── features/
│       ├── MergeView/
│       ├── SplitView/
│       ├── CompressView/
│       ├── RotateView/
│       ├── ConvertView/
│       └── OrganizeView/
├── services/
│   ├── pdf/
│   │   ├── index.ts
│   │   ├── ClientPDFService.ts   (implements IPDFService)
│   │   └── types.ts
│   └── api/
│       └── BackendPDFService.ts  (future, implements IPDFService)
├── hooks/
│   ├── useMerge.ts
│   ├── useSplit.ts
│   ├── useCompress.ts
│   ├── useRotate.ts
│   ├── useConvert.ts
│   └── useOrganize.ts
├── context/
│   └── AppContext.tsx
├── styles/
│   └── variables.css
└── utils/
    └── fileUtils.ts
```

## Error Handling

### Error Categories

| Category | Examples | User Message | Recovery |
|----------|----------|--------------|----------|
| **File Validation** | Invalid PDF, corrupted file, password-protected | "This file couldn't be processed. Please ensure it's a valid PDF." | Remove file, try another |
| **File Size** | File too large for browser memory | "This file is too large. Try splitting it or reducing the quality." | Compress or split first |
| **Page Range** | Invalid page numbers, out of bounds | "Some page numbers are invalid. Please check your selection." | Highlight invalid ranges |
| **Format** | Unsupported image format | "Only PNG and JPEG images are supported." | Show supported formats |
| **Processing** | Memory exhaustion, timeout | "Processing took too long. Try with fewer pages." | Retry with smaller file |
| **Download** | Blob creation failed | "Couldn't create download. Please try again." | Retry download |

### Error Boundaries
- React ErrorBoundary around each feature view
- Graceful degradation showing error message + retry option
- Console logging for debugging

### Validation
- File type validation on drop/select (only accept .pdf for PDF operations)
- Page range syntax validation with clear error messages
- File size warnings before heavy operations
- Maximum file count limits per operation

## Testing Plan

### Unit Tests (Vitest)
| Component | What to Test |
|-----------|--------------|
| `ClientPDFService` | merge, split, compress, rotate logic |
| File utilities | page counting, size formatting |
| Validation utils | page range parsing, file type checking |
| Hooks | state updates, error handling |

### Component Tests (React Testing Library)
| Component | What to Test |
|-----------|--------------|
| `DropZone` | drag events, file acceptance/rejection |
| `FileList` | add/remove files, reordering |
| `PageThumbnails` | page display, selection state |
| Feature Views | user interactions, state changes |

### Integration Tests
| Flow | What to Test |
|------|--------------|
| Merge flow | Upload files → reorder → merge → download |
| Split flow | Upload PDF → select ranges → split → download |
| Compress flow | Upload PDF → select quality → compress → verify size reduction |
| Error flow | Invalid file → error message → remove → retry |

### E2E Tests (Playwright)
| Scenario | Expected Result |
|----------|-----------------|
| Full merge workflow | Two PDFs merged successfully, download triggers |
| Error recovery | Invalid file shows error, user can remove and retry |
| Responsive layout | UI works at 320px, 768px, 1920px widths |

### Test File Structure
```
src/
├── __tests__/
│   ├── services/
│   │   └── ClientPDFService.test.ts
│   ├── utils/
│   │   └── fileUtils.test.ts
│   ├── hooks/
│   │   └── useMerge.test.ts
│   └── components/
│       ├── DropZone.test.tsx
│       └── FileList.test.tsx
├── e2e/
│   └── pdf-operations.spec.ts
└── setup.ts (test utilities, mocks)
```

### Mock Strategy
- Use `pdf-lib` directly for validating expected outputs
- Mock file reading with small test PDFs
- Use Blob API for file-like objects in tests

## Future Backend Extension

When extending with a backend:

1. Create `BackendPDFService` implementing `IPDFService`
2. Add API client with configurable base URL
3. Toggle service via environment variable or feature flag
4. Backend can use Python (PyPDF2, pdf2image) or Node.js (pdf-parse) libraries

### API Contract (Future)
```
POST /api/pdf/merge          - Merge multiple PDFs
POST /api/pdf/split          - Split PDF by ranges
POST /api/pdf/compress       - Compress PDF
POST /api/pdf/rotate         - Rotate pages
POST /api/pdf/convert        - Convert format
POST /api/pdf/reorganize     - Reorder pages
```

## Success Criteria

- [ ] All 6 features functional with client-side processing
- [ ] Drag and drop works reliably
- [ ] Files up to 20MB process without crashing
- [ ] Unit tests achieve >80% coverage on service layer
- [ ] E2E tests pass for core workflows
- [ ] No console errors in production build
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Responsive on mobile (320px+), tablet, desktop
