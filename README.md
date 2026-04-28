# PDF Buddy

A colorful, friendly web app for PDF manipulation - merge, split, compress, rotate, convert, and organize your PDFs. All processing happens client-side in your browser.

**Live Demo:** https://pdfbuddy.app

## Features

- **Merge PDFs** - Combine multiple PDF files into one
- **Split PDF** - Extract pages or split by ranges (e.g., "1-3, 4-6, 7-end")
- **Compress PDF** - Reduce file size with quality options (Low/Medium/High)
- **Rotate PDF** - Rotate individual pages by 90°
- **Convert to PDF** - Convert images (PNG, JPEG) to PDF
- **Organize PDF** - Delete pages from your PDF

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **PDF Processing:** pdf-lib (client-side WebAssembly)
- **Drag & Drop:** react-dropzone
- **Testing:** Vitest + React Testing Library + Playwright
- **Architecture:** Modular service layer (ready for backend extension)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pdfbuddy.git
cd pdfbuddy

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Architecture

```
src/
├── components/
│   ├── common/          # Shared components (Button, DropZone, FileList, etc.)
│   └── features/        # Feature views (MergeView, SplitView, etc.)
├── services/
│   └── pdf/
│       ├── types.ts           # TypeScript interfaces
│       ├── ClientPDFService.ts # Client-side PDF processing
│       └── index.ts           # Exports
├── hooks/              # React hooks (useMerge, useSplit, etc.)
├── context/            # React Context (AppContext)
├── utils/              # Utilities (fileUtils, downloadUtils, errorUtils)
└── styles/             # CSS variables and global styles
```

### Service Layer

The app uses a modular service layer (`IPDFService` interface) that allows swapping implementations:

- **ClientPDFService** - Current client-side implementation using pdf-lib
- **BackendPDFService** - Future backend implementation for heavy operations

This enables extending with a backend server when needed without changing the frontend code.

## Project Status

| Feature | Status |
|---------|--------|
| Merge | ✅ Complete |
| Split | ✅ Complete |
| Compress | ✅ Complete |
| Rotate | ✅ Complete |
| Convert (Images → PDF) | ✅ Complete |
| Convert (PDF → Images) | ⏸️ Not implemented (requires backend) |
| Organize | ✅ Complete |

**Test Coverage:** 249 unit tests, 33 E2E tests

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
