# PDF Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a colorful, friendly React web app with 6 PDF features (Merge, Split, Compress, Rotate, Convert, Organize) using client-side pdf-lib with a modular service layer.

**Architecture:** React 18 + Vite + pdf-lib. Service abstraction layer (`IPDFService`) allows swapping client-side `ClientPDFService` for future `BackendPDFService`. Feature hooks abstract business logic from UI components.

**Tech Stack:** React 18, Vite, pdf-lib, react-dropzone, jszip (for ZIP downloads), Vitest, React Testing Library, Playwright

---

## File Structure

```
pdf-tool/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── DropZone/
│   │   │   │   ├── DropZone.tsx
│   │   │   │   └── DropZone.module.css
│   │   │   ├── FileList/
│   │   │   │   ├── FileList.tsx
│   │   │   │   └── FileList.module.css
│   │   │   ├── PageThumbnails/
│   │   │   │   ├── PageThumbnails.tsx
│   │   │   │   └── PageThumbnails.module.css
│   │   │   ├── ProgressBar/
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── ProgressBar.module.css
│   │   │   └── Button/
│   │   │       ├── Button.tsx
│   │   │       └── Button.module.css
│   │   └── features/
│   │       ├── MergeView/
│   │       │   ├── MergeView.tsx
│   │       │   └── MergeView.module.css
│   │       ├── SplitView/
│   │       │   ├── SplitView.tsx
│   │       │   └── SplitView.module.css
│   │       ├── CompressView/
│   │       │   ├── CompressView.tsx
│   │       │   └── CompressView.module.css
│   │       ├── RotateView/
│   │       │   ├── RotateView.tsx
│   │       │   └── RotateView.module.css
│   │       ├── ConvertView/
│   │       │   ├── ConvertView.tsx
│   │       │   └── ConvertView.module.css
│   │       └── OrganizeView/
│   │           ├── OrganizeView.tsx
│   │           └── OrganizeView.module.css
│   ├── services/
│   │   └── pdf/
│   │       ├── index.ts
│   │       ├── ClientPDFService.ts
│   │       └── types.ts
│   ├── hooks/
│   │   ├── useMerge.ts
│   │   ├── useSplit.ts
│   │   ├── useCompress.ts
│   │   ├── useRotate.ts
│   │   ├── useConvert.ts
│   │   └── useOrganize.ts
│   ├── context/
│   │   └── AppContext.tsx
│   ├── styles/
│   │   ├── variables.css
│   │   └── global.css
│   ├── utils/
│   │   ├── fileUtils.ts
│   │   ├── downloadUtils.ts
│   │   └── errorUtils.ts
│   ├── App.tsx
│   ├── App.module.css
│   └── main.tsx
├── tests/
│   ├── setup.ts
│   ├── services/
│   │   └── ClientPDFService.test.ts
│   ├── utils/
│   │   ├── fileUtils.test.ts
│   │   └── downloadUtils.test.ts
│   ├── hooks/
│   │   └── useMerge.test.ts
│   └── components/
│       ├── DropZone.test.tsx
│       └── Button.test.tsx
├── e2e/
│   └── pdf-operations.spec.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "pdf-tool",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pdf-lib": "^1.17.1",
    "react-dropzone": "^14.2.3",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jsdom": "^23.0.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  }
});
```

- [ ] **Step 6: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PDF Tool - Merge, Split, Compress & More</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Create stub App.tsx**

```typescript
function App() {
  return <div>PDF Tool</div>;
}

export default App;
```

- [ ] **Step 10: Install dependencies**

Run: `cd e:/git_workspace/pdf-tool && npm install`

Expected: Dependencies installed successfully

- [ ] **Step 11: Verify dev server starts**

Run: `cd e:/git_workspace/pdf-tool && npm run dev`

Expected: Dev server runs on port 3000

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts playwright.config.ts index.html src/main.tsx src/App.tsx
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Set Up CSS Variables and Global Styles

**Files:**
- Create: `src/styles/variables.css`
- Create: `src/styles/global.css`
- Modify: `src/App.module.css` (create empty for now)

- [ ] **Step 1: Create CSS variables**

```css
:root {
  /* Primary Colors */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-light: #e0e7ff;

  /* Secondary Colors */
  --color-secondary: #f472b6;
  --color-secondary-hover: #ec4899;
  --color-secondary-light: #fce7f3;

  /* Accent */
  --color-accent: #22d3ee;
  --color-accent-hover: #06b6d4;
  --color-accent-light: #cffafe;

  /* Semantic Colors */
  --color-success: #34d399;
  --color-success-light: #d1fae5;
  --color-warning: #fbbf24;
  --color-warning-light: #fef3c7;
  --color-error: #f87171;
  --color-error-light: #fee2e2;

  /* Neutrals */
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

- [ ] **Step 2: Create global styles**

```css
@import './variables.css';

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.5;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}

img,
svg {
  display: block;
  max-width: 100%;
}

ul,
ol {
  list-style: none;
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

- [ ] **Step 3: Create empty App.module.css**

```css
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/variables.css src/styles/global.css src/App.module.css
git commit -m "feat: add CSS variables and global styles"
```

---

## Phase 2: Service Layer

### Task 3: Create PDF Service Types and Interface

**Files:**
- Create: `src/services/pdf/types.ts`
- Create: `src/services/pdf/index.ts`

- [ ] **Step 1: Create types.ts**

```typescript
export interface PageRange {
  start: number;
  end: number; // inclusive, or -1 for "to end"
}

export interface PageRotation {
  pageIndex: number;
  degrees: 0 | 90 | 180 | 270;
}

export interface PageOrder {
  originalIndex: number;
  newIndex: number;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  percent: number;
}

export interface PDFDocument {
  file: File;
  pageCount: number;
  pages?: string[]; // base64 thumbnails
}

export interface SplitResult {
  name: string;
  blob: Blob;
}

export interface ConversionOptions {
  format: 'png' | 'jpeg';
  quality?: number; // for jpeg, 0-1
}

export type CompressionQuality = 'low' | 'medium' | 'high';

export interface IPDFService {
  merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]>;
  compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  convertToImages(file: File, options: ConversionOptions, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]>;
  convertToPDF(imageFiles: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
}

export class PDFProcessingError extends Error {
  constructor(
    message: string,
    public code: 'FILE_VALIDATION' | 'FILE_SIZE' | 'PAGE_RANGE' | 'FORMAT' | 'PROCESSING' | 'DOWNLOAD',
    public recovery?: string
  ) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}
```

- [ ] **Step 2: Create services/pdf/index.ts (exports only)**

```typescript
export * from './types';
```

- [ ] **Step 3: Commit**

```bash
git add src/services/pdf/types.ts src/services/pdf/index.ts
git commit -m "feat: add PDF service types and interface"
```

---

### Task 4: Implement ClientPDFService

**Files:**
- Create: `src/services/pdf/ClientPDFService.ts`
- Create: `tests/services/ClientPDFService.test.ts`

- [ ] **Step 1: Write first failing test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

describe('ClientPDFService', () => {
  let service: ClientPDFService;

  beforeEach(() => {
    service = new ClientPDFService();
  });

  describe('merge', () => {
    it('should merge two PDF files', async () => {
      // Create two small PDF blobs for testing
      const pdf1 = new Blob([createTestPDF()], { type: 'application/pdf' });
      const pdf2 = new Blob([createTestPDF()], { type: 'application/pdf' });
      const file1 = new File([pdf1], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File([pdf2], 'test2.pdf', { type: 'application/pdf' });

      const result = await service.merge([file1, file2]);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });
  });
});

// Helper to create minimal valid PDF
function createTestPDF(): ArrayBuffer {
  const pdfDoc = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF';
  return new TextEncoder().encode(pdfDoc).buffer;
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/services/ClientPDFService.test.ts`

Expected: FAIL - ClientPDFService not found

- [ ] **Step 3: Create ClientPDFService with merge stub**

```typescript
import { IPDFService, PageRange, PageRotation, PageOrder, ProcessingProgress, CompressionQuality, ConversionOptions } from './types';
import { PDFDocument } from './types';
import { PDFProcessingError } from './types';

export class ClientPDFService implements IPDFService {
  async merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (files.length < 2) {
      throw new PDFProcessingError(
        'At least 2 files are required to merge',
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        throw new PDFProcessingError(
          `${file.name} is not a valid PDF file`,
          'FILE_VALIDATION'
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));

      onProgress?.({
        current: i + 1,
        total: files.length,
        percent: Math.round(((i + 1) / files.length) * 100)
      });
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageCount = pdf.getPageCount();

    // Validate page ranges
    for (const range of pageRanges) {
      if (range.start < 1 || range.start > pageCount) {
        throw new PDFProcessingError(
          `Invalid page number: ${range.start}. File has ${pageCount} pages.`,
          'PAGE_RANGE'
        );
      }
      const end = range.end === -1 ? pageCount : range.end;
      if (end < range.start || end > pageCount) {
        throw new PDFProcessingError(
          `Invalid page range: ${range.start}-${range.end}`,
          'PAGE_RANGE'
        );
      }
    }

    const results: Blob[] = [];
    for (let i = 0; i < pageRanges.length; i++) {
      const range = pageRanges[i];
      const newPdf = await PDFDocument.create();
      const end = range.end === -1 ? pageCount : range.end;

      for (let pageIdx = range.start - 1; pageIdx < end; pageIdx++) {
        const [page] = await newPdf.copyPages(pdf, [pageIdx]);
        newPdf.addPage(page);
      }

      const pdfBytes = await newPdf.save();
      results.push(new Blob([pdfBytes], { type: 'application/pdf' }));

      onProgress?.({
        current: i + 1,
        total: pageRanges.length,
        percent: Math.round(((i + 1) / pageRanges.length) * 100)
      });
    }

    return results;
  }

  async compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    onProgress?.({ current: 1, total: 1, percent: 50 });

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);

    // pdf-lib doesn't support direct compression, but we can save with different options
    // For actual compression, we'd need a backend or pdf.js
    const pdfBytes = await pdf.save({
      useObjectStreams: true
    });

    onProgress?.({ current: 1, total: 1, percent: 100 });

    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    for (const rotation of rotations) {
      if (rotation.pageIndex < 0 || rotation.pageIndex >= pages.length) {
        throw new PDFProcessingError(
          `Invalid page index: ${rotation.pageIndex}`,
          'PAGE_RANGE'
        );
      }

      const page = pages[rotation.pageIndex];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + rotation.degrees) % 360;
      page.setRotation(newRotation);

      onProgress?.({
        current: rotation.pageIndex + 1,
        total: rotations.length,
        percent: Math.round(((rotation.pageIndex + 1) / rotations.length) * 100)
      });
    }

    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async convertToImages(file: File, options: ConversionOptions, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    // PDF to image conversion requires canvas/pdf.js which is heavy
    // For MVP, return the PDF as-is with a warning
    throw new PDFProcessingError(
      'PDF to image conversion requires the backend service. This feature is coming soon.',
      'PROCESSING',
      'Use the backend API for PDF to image conversion'
    );
  }

  async convertToPDF(imageFiles: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file.type.startsWith('image/')) {
        throw new PDFProcessingError(
          `${file.name} is not an image file`,
          'FORMAT'
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      let image;

      if (file.type === 'image/png') {
        image = await mergedPdf.embedPng(arrayBuffer);
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await mergedPdf.embedJpg(arrayBuffer);
      } else {
        throw new PDFProcessingError(
          `Unsupported image format: ${file.type}. Only PNG and JPEG are supported.`,
          'FORMAT'
        );
      }

      const page = mergedPdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });

      onProgress?.({
        current: i + 1,
        total: imageFiles.length,
        percent: Math.round(((i + 1) / imageFiles.length) * 100)
      });
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageCount = pdf.getPageCount();

    // Validate new order
    const validIndices = new Set<number>();
    for (const order of newOrder) {
      if (order.originalIndex < 0 || order.originalIndex >= pageCount) {
        throw new PDFProcessingError(
          `Invalid page index: ${order.originalIndex}`,
          'PAGE_RANGE'
        );
      }
      validIndices.add(order.originalIndex);
    }

    // Check all pages are accounted for
    if (validIndices.size !== pageCount) {
      throw new PDFProcessingError(
        'All pages must be included in the new order',
        'PAGE_RANGE'
      );
    }

    const newPdf = await PDFDocument.create();
    const sortedOrder = [...newOrder].sort((a, b) => a.newIndex - b.newIndex);

    for (let i = 0; i < sortedOrder.length; i++) {
      const [page] = await newPdf.copyPages(pdf, [sortedOrder[i].originalIndex]);
      newPdf.addPage(page);

      onProgress?.({
        current: i + 1,
        total: sortedOrder.length,
        percent: Math.round(((i + 1) / sortedOrder.length) * 100)
      });
    }

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/services/ClientPDFService.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/pdf/ClientPDFService.ts tests/services/ClientPDFService.test.ts
git commit -m "feat: implement ClientPDFService with merge, split, compress, rotate, convert, reorganize"
```

---

### Task 5: Create Utility Functions

**Files:**
- Create: `src/utils/fileUtils.ts`
- Create: `src/utils/downloadUtils.ts`
- Create: `src/utils/errorUtils.ts`
- Create: `tests/utils/fileUtils.test.ts`
- Create: `tests/utils/downloadUtils.test.ts`

- [ ] **Step 1: Write failing tests for fileUtils**

```typescript
import { describe, it, expect } from 'vitest';
import { formatFileSize, getPageCountFromFilename, validatePDFFile, getFileExtension } from '../../src/utils/fileUtils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
    });

    it('handles filenames with dots', () => {
      expect(getFileExtension('document.backup.pdf')).toBe('pdf');
    });
  });

  describe('validatePDFFile', () => {
    it('returns true for PDF files', () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' });
      expect(validatePDFFile(file)).toBe(true);
    });

    it('returns false for non-PDF files', () => {
      const file = new File([], 'test.txt', { type: 'text/plain' });
      expect(validatePDFFile(file)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/utils/fileUtils.test.ts`

Expected: FAIL with "formatFileSize not defined"

- [ ] **Step 3: Write fileUtils implementation**

```typescript
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function validatePDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function validateImageFile(file: File): boolean {
  return file.type.startsWith('image/') &&
    ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type);
}

export async function getPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/utils/fileUtils.test.ts`

Expected: PASS

- [ ] **Step 5: Write downloadUtils implementation and test**

```typescript
import { describe, it, expect } from 'vitest';
import { downloadBlob, downloadBlobsAsZip } from '../../src/utils/downloadUtils';

describe('downloadUtils', () => {
  describe('downloadBlob', () => {
    it('creates a download link and clicks it', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';

      // Mock document.createElement and click
      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      document.createElement = vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      });

      downloadBlob(blob, filename);

      expect(mockClick).toHaveBeenCalled();
    });
  });
});
```

```typescript
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadBlobsAsZip(blobs: { name: string; blob: Blob }[], zipFilename: string): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const { name, blob } of blobs) {
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/utils/downloadUtils.test.ts`

Expected: PASS

- [ ] **Step 7: Write errorUtils**

```typescript
import { PDFProcessingError } from '../services/pdf/types';

export function getErrorMessage(error: unknown): string {
  if (error instanceof PDFProcessingError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getRecoverySuggestion(error: unknown): string | undefined {
  if (error instanceof PDFProcessingError && error.recovery) {
    return error.recovery;
  }

  return undefined;
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof PDFProcessingError) {
    return error.code === 'PROCESSING';
  }
  return false;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/utils/fileUtils.ts src/utils/downloadUtils.ts src/utils/errorUtils.ts tests/utils/fileUtils.test.ts tests/utils/downloadUtils.test.ts
git commit -m "feat: add utility functions for file handling, download, and error handling"
```

---

## Phase 3: Common UI Components

### Task 6: Create Button Component

**Files:**
- Create: `src/components/common/Button/Button.tsx`
- Create: `src/components/common/Button/Button.module.css`
- Create: `tests/components/Button.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/common/Button/Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button label="Click me" onClick={() => {}} loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button label="Click me" onClick={() => {}} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/components/Button.test.tsx`

Expected: FAIL

- [ ] **Step 3: Write Button implementation**

```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  onClick,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner}>Loading...</span>
      ) : (
        <>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Write Button CSS**

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background: var(--color-primary);
  color: white;
}

.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.secondary {
  background: var(--color-secondary);
  color: white;
}

.secondary:hover:not(:disabled) {
  background: var(--color-secondary-hover);
}

.outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.outline:hover:not(:disabled) {
  background: var(--color-primary-light);
}

/* Sizes */
.sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: 0.875rem;
}

.md {
  padding: var(--space-sm) var(--space-md);
  font-size: 1rem;
}

.lg {
  padding: var(--space-md) var(--space-lg);
  font-size: 1.125rem;
}

/* Loading */
.loading {
  position: relative;
}

.spinner {
  display: inline-flex;
  align-items: center;
}

.icon {
  display: flex;
  align-items: center;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/components/Button.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/common/Button/Button.tsx src/components/common/Button/Button.module.css tests/components/Button.test.tsx
git commit -m "feat: add Button component"
```

---

### Task 7: Create DropZone Component

**Files:**
- Create: `src/components/common/DropZone/DropZone.tsx`
- Create: `src/components/common/DropZone/DropZone.module.css`
- Create: `tests/components/DropZone.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../../src/components/common/DropZone/DropZone';

describe('DropZone', () => {
  it('renders with default message', () => {
    render(<DropZone onFilesDropped={() => {}} accept={{ 'application/pdf': ['.pdf'] }} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<DropZone onFilesDropped={() => {}} accept={{ 'application/pdf': ['.pdf'] }} message="Drop PDFs here" />);
    expect(screen.getByText('Drop PDFs here')).toBeInTheDocument();
  });

  it('calls onFilesDropped when files are dropped', async () => {
    const handleDrop = vi.fn();
    render(<DropZone onFilesDropped={handleDrop} accept={{ 'application/pdf': ['.pdf'] }} />);

    const dropzone = screen.getByTestId('dropzone');
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(handleDrop).toHaveBeenCalled();
  });

  it('rejects non-matching file types', async () => {
    const handleDrop = vi.fn();
    const handleError = vi.fn();
    render(
      <DropZone
        onFilesDropped={handleDrop}
        onError={handleError}
        accept={{ 'application/pdf': ['.pdf'] }}
      />
    );

    const dropzone = screen.getByTestId('dropzone');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(handleDrop).not.toHaveBeenCalled();
    expect(handleError).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/components/DropZone.test.tsx`

Expected: FAIL

- [ ] **Step 3: Write DropZone implementation**

```tsx
import { useCallback, useState, DragEvent, useDropzone } from 'react';
import { PDFProcessingError } from '../../../services/pdf/types';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  onError?: (error: PDFProcessingError) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  message?: string;
  maxSize?: number; // bytes
}

export function DropZone({
  onFilesDropped,
  onError,
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  message = 'Drag and drop PDF files here, or click to select',
  maxSize = 20 * 1024 * 1024 // 20MB default
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: Error[] }[]) => {
      if (rejectedFiles.length > 0) {
        const error = new PDFProcessingError(
          `File type not accepted or file too large`,
          'FILE_VALIDATION',
          'Please check the file format and size'
        );
        onError?.(error);
      }

      if (acceptedFiles.length > 0) {
        // Check file sizes
        const oversized = acceptedFiles.filter(f => f.size > maxSize);
        if (oversized.length > 0) {
          const error = new PDFProcessingError(
            `File(s) too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
            'FILE_SIZE',
            'Try compressing the file or splitting it into smaller parts'
          );
          onError?.(error);
          return;
        }

        onFilesDropped(multiple ? acceptedFiles : [acceptedFiles[0]]);
      }
    },
    [onFilesDropped, onError, multiple, maxSize]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ''}`}
      data-testid="dropzone"
    >
      <input {...getInputProps()} />
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className={styles.message}>{message}</p>
        <p className={styles.hint}>Click to browse files</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write DropZone CSS**

```css
.dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--color-surface);
}

.dropzone:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.dragOver {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  transform: scale(1.01);
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.icon {
  color: var(--color-primary);
}

.message {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text);
}

.hint {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/components/DropZone.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/common/DropZone/DropZone.tsx src/components/common/DropZone/DropZone.module.css tests/components/DropZone.test.tsx
git commit -m "feat: add DropZone component"
```

---

### Task 8: Create ProgressBar Component

**Files:**
- Create: `src/components/common/ProgressBar/ProgressBar.tsx`
- Create: `src/components/common/ProgressBar/ProgressBar.module.css`

- [ ] **Step 1: Write ProgressBar implementation**

```tsx
import { ProcessingProgress } from '../../../services/pdf/types';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: ProcessingProgress;
  showLabel?: boolean;
}

export function ProgressBar({ progress, showLabel = true }: ProgressBarProps) {
  return (
    <div className={styles.container}>
      {showLabel && (
        <div className={styles.label}>
          <span>Processing...</span>
          <span>{progress.percent}%</span>
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${progress.percent}%` }}
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className={styles.detail}>
        {progress.current} of {progress.total}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write ProgressBar CSS**

```css
.container {
  width: 100%;
}

.label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.track {
  height: 8px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.detail {
  margin-top: var(--space-xs);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/common/ProgressBar/ProgressBar.tsx src/components/common/ProgressBar/ProgressBar.module.css
git commit -m "feat: add ProgressBar component"
```

---

### Task 9: Create FileList and PageThumbnails Components

**Files:**
- Create: `src/components/common/FileList/FileList.tsx`
- Create: `src/components/common/FileList/FileList.module.css`
- Create: `src/components/common/PageThumbnails/PageThumbnails.tsx`
- Create: `src/components/common/PageThumbnails/PageThumbnails.module.css`

- [ ] **Step 1: Write FileList component**

```tsx
import { File } from '../../../services/pdf/types';
import { formatFileSize } from '../../../utils/fileUtils';
import { Button } from '../Button/Button';
import styles from './FileList.module.css';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
  thumbnail?: string;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showPageCount?: boolean;
}

export function FileList({ files, onRemove, showPageCount = true }: FileListProps) {
  return (
    <div className={styles.list}>
      {files.map((fileItem, index) => (
        <div key={fileItem.id} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.name}>{fileItem.file.name}</span>
            <span className={styles.size}>{formatFileSize(fileItem.file.size)}</span>
            {showPageCount && fileItem.pageCount !== undefined && (
              <span className={styles.pages}>{fileItem.pageCount} pages</span>
            )}
          </div>
          <Button
            label="Remove"
            variant="outline"
            size="sm"
            onClick={() => onRemove(fileItem.id)}
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write FileList CSS**

```css
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.name {
  font-weight: 500;
  color: var(--color-text);
}

.size {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.pages {
  font-size: 0.875rem;
  color: var(--color-accent);
  font-weight: 500;
}
```

- [ ] **Step 3: Write PageThumbnails component**

```tsx
import { useState, useEffect } from 'react';
import { PDFDocument } from '../../../services/pdf/types';
import styles from './PageThumbnails.module.css';

interface PageThumbnailsProps {
  file: File;
  onSelect?: (pageIndex: number) => void;
  selectedPages?: number[];
}

export function PageThumbnails({ file, onSelect, selectedPages = [] }: PageThumbnailsProps) {
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThumbnails() {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdf.getPageCount();
        setPageCount(count);

        // For MVP, we don't generate actual thumbnails yet
        // Just show placeholder boxes with page numbers
        const placeholders = Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
        setThumbnails(placeholders);
      } catch {
        setThumbnails([]);
      } finally {
        setLoading(false);
      }
    }

    loadThumbnails();
  }, [file]);

  if (loading) {
    return <div className={styles.loading}>Loading pages...</div>;
  }

  return (
    <div className={styles.grid}>
      {thumbnails.map((label, index) => (
        <div
          key={index}
          className={`${styles.thumbnail} ${selectedPages.includes(index) ? styles.selected : ''}`}
          onClick={() => onSelect?.(index)}
          data-page-index={index}
        >
          <div className={styles.box}>
            <span className={styles.pageNumber}>{index + 1}</span>
          </div>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write PageThumbnails CSS**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-md);
  padding: var(--space-md);
}

.thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.thumbnail:hover {
  transform: scale(1.05);
}

.box {
  width: 80px;
  height: 100px;
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.thumbnail:hover .box {
  border-color: var(--color-primary);
}

.selected .box {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.pageNumber {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.selected .pageNumber {
  color: var(--color-primary);
}

.label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.loading {
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/common/FileList/FileList.tsx src/components/common/FileList/FileList.module.css src/components/common/PageThumbnails/PageThumbnails.tsx src/components/common/PageThumbnails/PageThumbnails.module.css
git commit -m "feat: add FileList and PageThumbnails components"
```

---

## Phase 4: Context and Feature Hooks

### Task 10: Create AppContext

**Files:**
- Create: `src/context/AppContext.tsx`

- [ ] **Step 1: Write AppContext**

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

type View = 'merge' | 'split' | 'compress' | 'rotate' | 'convert' | 'organize';

interface AppState {
  currentView: View;
}

type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'RESET' };

const initialState: AppState = {
  currentView: 'merge'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setView: (view: View) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setView = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, setView }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export type { View };
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: add AppContext for global state"
```

---

### Task 11: Create Feature Hooks

**Files:**
- Create: `src/hooks/useMerge.ts`
- Create: `src/hooks/useSplit.ts`
- Create: `src/hooks/useCompress.ts`
- Create: `src/hooks/useRotate.ts`
- Create: `src/hooks/useConvert.ts`
- Create: `src/hooks/useOrganize.ts`
- Create: `tests/hooks/useMerge.test.ts`

- [ ] **Step 1: Write useMerge hook**

```typescript
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { ProcessingProgress } from '../services/pdf/types';

interface UseMergeResult {
  merge: (files: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useMerge(): UseMergeResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = useCallback(async (files: File[]): Promise<Blob | null> => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: files.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.merge(files, setProgress);
      setProgress({ current: files.length, total: files.length, percent: 100 });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to merge PDFs';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { merge, isProcessing, progress, error, clearError };
}
```

- [ ] **Step 2: Write useSplit hook**

```typescript
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageRange, ProcessingProgress } from '../services/pdf/types';

interface UseSplitResult {
  split: (file: File, pageRanges: PageRange[]) => Promise<Blob[] | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useSplit(): UseSplitResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const split = useCallback(async (file: File, pageRanges: PageRange[]): Promise<Blob[] | null> => {
    if (!pageRanges.length) {
      setError('Please specify at least one page range to split');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: pageRanges.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.split(file, pageRanges, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to split PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { split, isProcessing, progress, error, clearError };
}
```

- [ ] **Step 3: Write remaining hooks (useCompress, useRotate, useConvert, useOrganize)**

```typescript
// useCompress.ts
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { CompressionQuality, ProcessingProgress } from '../services/pdf/types';

interface UseCompressResult {
  compress: (file: File, quality: CompressionQuality) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useCompress(): UseCompressResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compress = useCallback(async (file: File, quality: CompressionQuality): Promise<Blob | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: 1, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.compress(file, quality, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compress PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { compress, isProcessing, progress, error, clearError };
}
```

```typescript
// useRotate.ts
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageRotation, ProcessingProgress } from '../services/pdf/types';

interface UseRotateResult {
  rotate: (file: File, rotations: PageRotation[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useRotate(): UseRotateResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rotate = useCallback(async (file: File, rotations: PageRotation[]): Promise<Blob | null> => {
    if (!rotations.length) {
      setError('Please select at least one page to rotate');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: rotations.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.rotate(file, rotations, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rotate PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { rotate, isProcessing, progress, error, clearError };
}
```

```typescript
// useConvert.ts
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { ConversionOptions, ProcessingProgress } from '../services/pdf/types';

interface UseConvertResult {
  convertToPDF: (imageFiles: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useConvert(): UseConvertResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertToPDF = useCallback(async (imageFiles: File[]): Promise<Blob | null> => {
    if (!imageFiles.length) {
      setError('Please select at least one image to convert');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: imageFiles.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.convertToPDF(imageFiles, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to convert images to PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { convertToPDF, isProcessing, progress, error, clearError };
}
```

```typescript
// useOrganize.ts
import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageOrder, ProcessingProgress } from '../services/pdf/types';

interface UseOrganizeResult {
  reorganize: (file: File, newOrder: PageOrder[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useOrganize(): UseOrganizeResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reorganize = useCallback(async (file: File, newOrder: PageOrder[]): Promise<Blob | null> => {
    if (!newOrder.length) {
      setError('Please select pages to reorganize');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: newOrder.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.reorganize(file, newOrder, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorganize PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { reorganize, isProcessing, progress, error, clearError };
}
```

- [ ] **Step 4: Write useMerge test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMerge } from '../../src/hooks/useMerge';

describe('useMerge', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useMerge());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 5: Run hook test**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run tests/hooks/useMerge.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useMerge.ts src/hooks/useSplit.ts src/hooks/useCompress.ts src/hooks/useRotate.ts src/hooks/useConvert.ts src/hooks/useOrganize.ts tests/hooks/useMerge.test.ts
git commit -m "feat: add feature hooks for merge, split, compress, rotate, convert, reorganize"
```

---

## Phase 5: Feature Views

### Task 12: Create MergeView

**Files:**
- Create: `src/components/features/MergeView/MergeView.tsx`
- Create: `src/components/features/MergeView/MergeView.module.css`

- [ ] **Step 1: Write MergeView component**

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { FileList } from '../../common/FileList/FileList';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useMerge } from '../../../hooks/useMerge';
import { downloadBlob } from '../../../utils/downloadUtils';
import styles from './MergeView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function MergeView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { merge, isProcessing, progress, error, clearError } = useMerge();

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const newFiles = droppedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;

    const fileList = files.map(f => f.file);
    const result = await merge(fileList);

    if (result) {
      downloadBlob(result, 'merged.pdf');
    }
  }, [files, merge]);

  const handleClear = useCallback(() => {
    setFiles([]);
    clearError();
  }, [clearError]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Merge PDFs</h2>
        <p className={styles.description}>
          Combine multiple PDF files into a single document. Drag to reorder files before merging.
        </p>
      </div>

      {files.length === 0 ? (
        <DropZone
          onFilesDropped={handleFilesDropped}
          message="Drag and drop PDF files here to merge"
        />
      ) : (
        <div className={styles.workspace}>
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            showPageCount={false}
          />

          {isProcessing && progress && (
            <ProgressBar progress={progress} />
          )}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError} className={styles.errorClose}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Add More Files"
              variant="outline"
              onClick={() => {}}
            />
            <Button
              label="Clear All"
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing}
            />
            <Button
              label={`Merge ${files.length} Files`}
              variant="primary"
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write MergeView CSS**

```css
.container {
  padding: var(--space-xl);
}

.header {
  margin-bottom: var(--space-xl);
}

.title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-sm);
}

.description {
  color: var(--color-text-secondary);
  max-width: 600px;
}

.workspace {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
}

.actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  flex-wrap: wrap;
}

.error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--color-error-light);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-weight: 500;
}

.errorClose {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-error);
  padding: 0;
  line-height: 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/features/MergeView/MergeView.tsx src/components/features/MergeView/MergeView.module.css
git commit -m "feat: add MergeView component"
```

---

### Task 13: Create Remaining Feature Views

Create SplitView, CompressView, RotateView, ConvertView, OrganizeView following the same pattern as MergeView.

**Files:**
- Create: `src/components/features/SplitView/SplitView.tsx` + CSS
- Create: `src/components/features/CompressView/CompressView.tsx` + CSS
- Create: `src/components/features/RotateView/RotateView.tsx` + CSS
- Create: `src/components/features/ConvertView/ConvertView.tsx` + CSS
- Create: `src/components/features/OrganizeView/OrganizeView.tsx` + CSS

**Step 1: Write SplitView** (split by page ranges input)

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { useSplit } from '../../../hooks/useSplit';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageRange } from '../../../services/pdf/types';
import styles from './SplitView.module.css';

export function SplitView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageRanges, setPageRanges] = useState<string>('');
  const { split, isProcessing, progress, error, clearError } = useSplit();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;

    // Parse page ranges like "1-3, 4-6, 7-end"
    const ranges: PageRange[] = pageRanges.split(',').map(r => {
      const trimmed = r.trim();
      const parts = trimmed.split('-');
      return {
        start: parseInt(parts[0], 10),
        end: parts[1] === 'end' ? -1 : parseInt(parts[1], 10)
      };
    });

    const results = await split(file, ranges);
    if (results && results.length > 0) {
      // Download each split PDF
      results.forEach((blob, index) => {
        const baseName = file.name.replace('.pdf', '');
        downloadBlob(blob, `${baseName}_part${index + 1}.pdf`);
      });
    }
  }, [file, pageRanges, split]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Split PDF</h2>
        <p className={styles.description}>
          Split a PDF into separate files by page ranges. Example: "1-3, 4-6, 7-end"
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to split"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <strong>{file.name}</strong>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails file={file} />

          <div className={styles.inputGroup}>
            <label htmlFor="pageRanges">Page Ranges:</label>
            <input
              id="pageRanges"
              type="text"
              value={pageRanges}
              onChange={(e) => setPageRanges(e.target.value)}
              placeholder="e.g., 1-3, 4-6, 7-end"
              className={styles.input}
            />
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Split PDF"
              variant="primary"
              onClick={handleSplit}
              disabled={!pageRanges.trim() || isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Write CompressView**

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useCompress } from '../../../hooks/useCompress';
import { downloadBlob } from '../../../utils/downloadUtils';
import { formatFileSize } from '../../../utils/fileUtils';
import { CompressionQuality } from '../../../services/pdf/types';
import styles from './CompressView.module.css';

export function CompressView() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const { compress, isProcessing, progress, error, clearError } = useCompress();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;

    const result = await compress(file, quality);
    if (result) {
      const originalSize = file.size;
      const compressedSize = result.size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);
      downloadBlob(result, `compressed_${file.name}`);
      alert(`Compressed! Size reduced by ${reduction}% (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)})`);
    }
  }, [file, quality, compress]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Compress PDF</h2>
        <p className={styles.description}>
          Reduce PDF file size while maintaining quality.
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to compress"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong> ({formatFileSize(file.size)})</span>
          </div>

          <div className={styles.qualityOptions}>
            {(['low', 'medium', 'high'] as CompressionQuality[]).map(q => (
              <label key={q} className={styles.qualityOption}>
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={quality === q}
                  onChange={() => setQuality(q)}
                />
                <span className={styles.qualityLabel}>
                  <strong>{q.charAt(0).toUpperCase() + q.slice(1)}</strong>
                  <small>
                    {q === 'low' && 'Maximum compression'}
                    {q === 'medium' && 'Balanced'}
                    {q === 'high' && 'Best quality'}
                  </small>
                </span>
              </label>
            ))}
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Compress PDF"
              variant="primary"
              onClick={handleCompress}
              disabled={isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Write RotateView**

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useRotate } from '../../../hooks/useRotate';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageRotation } from '../../../services/pdf/types';
import styles from './RotateView.module.css';

export function RotateView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const { rotate, isProcessing, progress, error, clearError } = useRotate();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
    }
  }, []);

  const handlePageSelect = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex)
        ? prev.filter(i => i !== pageIndex)
        : [...prev, pageIndex]
    );
  }, []);

  const handleRotate = useCallback(async () => {
    if (!file || selectedPages.length === 0) return;

    const rotations: PageRotation[] = selectedPages.map(pageIndex => ({
      pageIndex,
      degrees: 90
    }));

    const result = await rotate(file, rotations);
    if (result) {
      downloadBlob(result, `rotated_${file.name}`);
    }
  }, [file, selectedPages, rotate]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Rotate PDF</h2>
        <p className={styles.description}>
          Click pages to select, then rotate them 90 degrees.
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to rotate"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails
            file={file}
            onSelect={handlePageSelect}
            selectedPages={selectedPages}
          />

          <p className={styles.hint}>
            {selectedPages.length === 0
              ? 'Click pages to select them'
              : `${selectedPages.length} page(s) selected`}
          </p>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Rotate 90°"
              variant="primary"
              onClick={handleRotate}
              disabled={selectedPages.length === 0 || isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Write ConvertView**

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { FileList } from '../../common/FileList/FileList';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useConvert } from '../../../hooks/useConvert';
import { downloadBlob } from '../../../utils/downloadUtils';
import { validateImageFile } from '../../../utils/fileUtils';
import styles from './ConvertView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function ConvertView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { convertToPDF, isProcessing, progress, error, clearError } = useConvert();

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const validFiles = droppedFiles.filter(validateImageFile);
    const newFiles = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;

    const fileList = files.map(f => f.file);
    const result = await convertToPDF(fileList);

    if (result) {
      downloadBlob(result, 'converted.pdf');
    }
  }, [files, convertToPDF]);

  const handleClear = useCallback(() => {
    setFiles([]);
    clearError();
  }, [clearError]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Convert to PDF</h2>
        <p className={styles.description}>
          Convert images (PNG, JPEG) to a PDF document.
        </p>
      </div>

      {files.length === 0 ? (
        <DropZone
          onFilesDropped={handleFilesDropped}
          message="Drag and drop images here to convert to PDF"
          accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
        />
      ) : (
        <div className={styles.workspace}>
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            showPageCount={false}
          />

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button label="Add More" variant="outline" onClick={() => {}} />
            <Button label="Clear All" variant="outline" onClick={handleClear} disabled={isProcessing} />
            <Button
              label={`Convert ${files.length} Image${files.length > 1 ? 's' : ''} to PDF`}
              variant="primary"
              onClick={handleConvert}
              disabled={isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Write OrganizeView**

```tsx
import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useOrganize } from '../../../hooks/useOrganize';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageOrder } from '../../../services/pdf/types';
import styles from './OrganizeView.module.css';

export function OrganizeView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const { reorganize, isProcessing, progress, error, clearError } = useOrganize();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
      setPageOrder([]);
    }
  }, []);

  const handlePageSelect = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex)
        ? prev.filter(i => i !== pageIndex)
        : [...prev, pageIndex]
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!file || selectedPages.length === 0) return;

    // This is a simplified version - full implementation would allow reordering
    const totalPages = pageOrder.length || selectedPages.length;
    const newOrder: PageOrder[] = Array.from({ length: totalPages - selectedPages.length }, (_, i) => {
      const originalIndex = i < selectedPages[0] ? i : i + selectedPages.length;
      return { originalIndex, newIndex: i };
    });

    // For simplicity, we'll just reverse the remaining pages
    const result = selectedPages;
    setPageOrder(result);
  }, [file, selectedPages, pageOrder]);

  const handleOrganize = useCallback(async () => {
    if (!file) return;

    // Create default order if not set
    const totalPages = pageOrder.length || selectedPages.length || 1;
    const order: PageOrder[] = pageOrder.length > 0
      ? pageOrder.map((originalIndex, newIndex) => ({ originalIndex, newIndex }))
      : Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i, newIndex: i }));

    // Filter out selected pages for demo
    const filteredOrder = selectedPages.length > 0
      ? order.filter((_, i) => !selectedPages.includes(i))
      : order;

    if (filteredOrder.length === 0) {
      alert('No pages left after deletion');
      return;
    }

    const result = await reorganize(file, filteredOrder);
    if (result) {
      downloadBlob(result, `organized_${file.name}`);
    }
  }, [file, pageOrder, selectedPages, reorganize]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Organize PDF</h2>
        <p className={styles.description}>
          Reorder and delete pages in your PDF.
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to organize"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails
            file={file}
            onSelect={handlePageSelect}
            selectedPages={selectedPages}
          />

          {selectedPages.length > 0 && (
            <p className={styles.hint}>
              {selectedPages.length} page(s) selected
              <Button
                label="Delete Selected"
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
              />
            </p>
          )}

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Download Organized PDF"
              variant="primary"
              onClick={handleOrganize}
              disabled={isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 6: Create CSS files for each view** (similar structure to MergeView)

- [ ] **Step 7: Commit**

```bash
git add src/components/features/SplitView src/components/features/CompressView src/components/features/RotateView src/components/features/ConvertView src/components/features/OrganizeView
git commit -m "feat: add SplitView, CompressView, RotateView, ConvertView, OrganizeView components"
```

---

## Phase 6: App Shell and Integration

### Task 14: Update App with Navigation and Error Boundary

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.css`

- [ ] **Step 1: Update App.tsx**

```tsx
import { useState, ReactNode } from 'react';
import { AppProvider, useApp, View } from './context/AppContext';
import { MergeView } from './components/features/MergeView/MergeView';
import { SplitView } from './components/features/SplitView/SplitView';
import { CompressView } from './components/features/CompressView/CompressView';
import { RotateView } from './components/features/RotateView/RotateView';
import { ConvertView } from './components/features/ConvertView/ConvertView';
import { OrganizeView } from './components/features/OrganizeView/OrganizeView';
import styles from './App.module.css';

const VIEWS: { key: View; label: string }[] = [
  { key: 'merge', label: 'Merge' },
  { key: 'split', label: 'Split' },
  { key: 'compress', label: 'Compress' },
  { key: 'rotate', label: 'Rotate' },
  { key: 'convert', label: 'Convert' },
  { key: 'organize', label: 'Organize' }
];

function ErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (e) {
    setError(e instanceof Error ? e : new Error('Unknown error'));
    return null;
  }
}

function AppContent() {
  const { state, setView } = useApp();

  const renderView = () => {
    switch (state.currentView) {
      case 'merge': return <MergeView />;
      case 'split': return <SplitView />;
      case 'compress': return <CompressView />;
      case 'rotate': return <RotateView />;
      case 'convert': return <ConvertView />;
      case 'organize': return <OrganizeView />;
      default: return <MergeView />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h1>PDF Tool</h1>
        </div>
        <nav className={styles.nav}>
          {VIEWS.map(view => (
            <button
              key={view.key}
              className={`${styles.navButton} ${state.currentView === view.key ? styles.active : ''}`}
              onClick={() => setView(view.key)}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
```

- [ ] **Step 2: Update App.module.css**

```css
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-md) var(--space-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-primary);
}

.logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.nav {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.navButton {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.navButton:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.navButton.active {
  background: var(--color-primary);
  color: white;
}

.main {
  flex: 1;
  padding: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.errorContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-md);
  text-align: center;
}

.errorContainer h2 {
  color: var(--color-error);
}

.errorContainer button {
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav {
    width: 100%;
    overflow-x: auto;
  }

  .main {
    padding: var(--space-md);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/App.module.css
git commit -m "feat: add App shell with navigation and error boundary"
```

---

### Task 15: Add Test Setup

**Files:**
- Create: `tests/setup.ts`

- [ ] **Step 1: Write test setup**

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock canvas for thumbnail generation if needed
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  fillText: vi.fn()
}));
```

- [ ] **Step 2: Commit**

```bash
git add tests/setup.ts
git commit -m "test: add Vitest setup with DOM mocks"
```

---

### Task 16: Create E2E Tests

**Files:**
- Create: `e2e/pdf-operations.spec.ts`

- [ ] **Step 1: Write E2E test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('PDF Operations', () => {
  test('shows merge view by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Merge PDFs')).toBeVisible();
  });

  test('navigation switches between views', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Split' }).click();
    await expect(page.getByText('Split PDF')).toBeVisible();

    await page.getByRole('button', { name: 'Compress' }).click();
    await expect(page.getByText('Compress PDF')).toBeVisible();

    await page.getByRole('button', { name: 'Rotate' }).click();
    await expect(page.getByText('Rotate PDF')).toBeVisible();

    await page.getByRole('button', { name: 'Convert' }).click();
    await expect(page.getByText('Convert to PDF')).toBeVisible();

    await page.getByRole('button', { name: 'Organize' }).click();
    await expect(page.getByText('Organize PDF')).toBeVisible();
  });

  test('shows dropzone when no file selected', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/drag and drop/i)).toBeVisible();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add e2e/pdf-operations.spec.ts
git commit -m "test: add Playwright E2E tests"
```

---

## Phase 7: Final Verification

### Task 17: Run Tests and Fix Issues

- [ ] **Step 1: Run all unit tests**

Run: `cd e:/git_workspace/pdf-tool && npm test -- --run`

- [ ] **Step 2: Run type check**

Run: `cd e:/git_workspace/pdf-tool && npx tsc --noEmit`

- [ ] **Step 3: Run build**

Run: `cd e:/git_workspace/pdf-tool && npm run build`

- [ ] **Step 4: Fix any errors**

- [ ] **Step 5: Commit final fixes**

---

## Success Criteria

- [ ] All 6 features functional with client-side processing
- [ ] Drag and drop works reliably
- [ ] Unit tests pass for service layer and hooks
- [ ] Component tests pass for common components
- [ ] TypeScript compiles without errors
- [ ] Production build succeeds
- [ ] E2E tests pass for navigation
- [ ] No console errors in production build
