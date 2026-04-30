# PDF Tool - Specification

> **Last Updated:** 2026-04-29

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
  - **Visual Selection** - Click pages to select, drag to 2nd box
  - **Page Ranges** - Enter ranges (e.g., "1-3, 4-6, 7")
- Two-box layout: Source Pages (left) + Selected Pages (right)
- Each selected page has × remove button at top-right
- Preview shows result AFTER split (not before)
- Download only exports selected pages

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
- Visual page thumbnails in grid
- Click pages to select them
- Transform options: Rotate 90°, Rotate 180°, Rotate 270°, Mirror H, Mirror V
- Two-box layout: Source Pages (left) + Result Preview (right)
- Preview shows result AFTER transformation
- Download button to export transformed PDF

### 5. Convert
- **Images to PDF**: Select images (PNG, JPEG), reorder, download PDF
- **Default page size: A4** (595 x 842 points) - Images are scaled to fit A4 with margins
- **Preview button** - Preview converted PDF before download
- **PDF to Images**: ← NOT YET IMPLEMENTED - Requires backend service (pdf-lib cannot render PDFs to images client-side)

### 6. Organize PDF
- Select single PDF file
- Visual page thumbnails in grid
- Select pages and delete them
- Drag to reorder pages (both within grid) ← TODO
- **Preview button to view full PDF**
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
| State | React Context + useReducer (single AppContext for view routing) |
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

## UI Design (Smallpdf-Inspired)

This app follows a Smallpdf-inspired design system for a clean, modern look.

### Design Principles

| Aspect | Smallpdf Approach |
|--------|-----------------|
| **Hero Section** | Clean white background, centered headline, single CTA |
| **Tool Cards** | Rounded white cards with subtle shadow, icon + title + description |
| **Drop Zone** | Large dashed border area, icon + text, file list appears after upload |
| **Progress** | Circular progress indicator with percentage, green checkmark on complete |
| **Buttons** | Rounded (8px), filled primary (indigo), outlined secondary |
| **Typography** | Inter font, generous line-height (1.5), ample spacing |
| **Whitespace** | 48px+ vertical spacing between sections |
| **Color Coding** | Green for success, Red for error, Amber for warning, all with icons |

### Typography System

```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --text-xs: 0.75rem;    /* 12px - captions */
  --text-sm: 0.875rem;   /* 14px - secondary text */
  --text-base: 1rem;      /* 16px - body */
  --text-lg: 1.125rem;    /* 18px - emphasized body */
  --text-xl: 1.25rem;     /* 20px - section titles */
  --text-2xl: 1.5rem;     /* 24px - page titles */
  --text-3xl: 1.875rem;   /* 30px - hero headlines */
}
```

### Spacing System (8px grid)

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
}
```

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 8px |
| Cards | 12px |
| Modals | 16px |
| Thumbnails | 8px |

### Shadows

```css
--shadow-card: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-dropdown: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
--shadow-modal: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
```

### Component Standards

#### Button Hierarchy
- **Primary:** Filled indigo (#6366f1), white text, 8px radius, 44px height
- **Secondary:** White bg, indigo border, indigo text
- **Tertiary:** No border, indigo text only
- **Destructive:** Red (#ef4444) filled

#### Card Component
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  padding: var(--space-6);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
```

### Advanced UI Features (Planned)

| Feature | Status | Description |
|---------|--------|-------------|
| Dark Mode | 📋 Planned | System preference detection + manual toggle |
| Watermark Support | 📋 Planned | Text or image watermarks with position/opacity controls |
| Electronic Signatures | 📋 Planned | Draw/type/upload signature with reuse |
| PDF to Images | ⏸️ Not Implemented | Requires backend service |

### Accessibility

- Tab order follows visual flow
- Focus indicators visible (3px outline)
- ARIA labels on interactive elements
- Color contrast meets WCAG AA

---

## Success Criteria

- [x] All 6 features functional with client-side processing
- [x] Drag and drop works reliably
- [x] Files up to 20MB process without crashing
- [x] Preview feature implemented on all views (Merge, Split, Rotate, Compress, Organize, Convert)
- [x] Preview modal component created and tested
- [x] E2E tests pass for core workflows (20 tests passing)
- [x] Unit tests pass (254 tests passing)
- [ ] No console errors in production build (not verified)
- [ ] Works on Chrome, Firefox, Safari, Edge (only Chrome verified)
- [ ] Responsive on mobile (320px+), tablet, desktop (not verified)

---

## File Structure

```
pdf-tool/
├── SPEC.md                          # This file
├── testplan.md                      # Test plan and coverage details (renamed from test-plan.md)
├── implementation.md                # Implementation status and approach
├── src/
│   ├── App.tsx                      # Main app with view routing
│   ├── main.tsx                     # Entry point
│   ├── context/
│   │   └── AppContext.tsx           # Single context for view state
│   ├── styles/
│   │   ├── variables.css            # CSS custom properties
│   │   └── global.css               # Global styles
│   ├── utils/
│   │   ├── downloadUtils.ts         # Download blob helpers
│   │   ├── errorUtils.ts            # Error formatting helpers
│   │   └── fileUtils.ts             # File validation utilities
│   ├── components/
│   │   ├── common/
│   │   │   ├── DropZone/            # Drag and drop file input
│   │   │   ├── FileList/            # File list with remove action
│   │   │   ├── PageThumbnails/      # PDF page thumbnail grid
│   │   │   ├── PreviewModal/        # Full PDF preview modal
│   │   │   ├── ProgressBar/         # Processing progress indicator
│   │   │   └── Button/              # Reusable button component
│   │   └── features/
│   │       ├── MergeView/           # Merge multiple PDFs (drag-to-reorder files)
│   │       ├── SplitView/           # Split PDF (visual selection + page ranges)
│   │       ├── CompressView/        # Compress PDF (Low/Medium/High quality)
│   │       ├── RotateView/          # Rotate PDF (90°/180°/270°/Mirror H/Mirror V)
│   │       ├── ConvertView/         # Convert: Images→PDF (PNG/JPEG to PDF)
│   │       └── OrganizeView/        # Reorganize PDF (select & delete pages, drag-reorder)
│   ├── services/pdf/
│   │   ├── types.ts                 # Shared TypeScript interfaces
│   │   ├── index.ts                 # Barrel exports
│   │   ├── ClientPDFService.ts      # Main PDF operations service
│   │   ├── pdfOperations.ts         # Core PDF operations
│   │   ├── pdfValidation.ts         # File validation utilities
│   │   ├── pdfFallback.ts           # Fallback strategies
│   │   ├── mergeOperation.ts        # Merge multiple PDFs
│   │   ├── splitOperation.ts        # Split PDF by selection/ranges
│   │   ├── compressOperation.ts     # Compress with quality levels
│   │   ├── rotateOperation.ts       # Rotate/mirror pages
│   │   ├── convertOperation.ts      # Images↔PDF conversion
│   │   └── reorganizeOperation.ts   # Reorder/delete pages
│   └── hooks/
│       ├── useMerge.ts              # Merge state management
│       ├── useSplit.ts              # Split state management
│       ├── useCompress.ts           # Compress state management
│       ├── useRotate.ts             # Rotate state management
│       ├── useConvert.ts            # Convert state management
│       └── useOrganize.ts           # Organize state management
```

---

## Test Documentation

All test-related documentation including unit tests, integration tests, E2E tests, test coverage goals, and test data specifications is located in:

**[testplan.md](./testplan.md)**

This includes:
- Unit test coverage plan (>95% goal)
- E2E comprehensive test scenarios
- Test PDF file requirements (visually distinguishable files)
- Integration test specifications
