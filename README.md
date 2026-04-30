# PDF Buddy

A colorful, friendly web app for PDF manipulation - merge, split, compress, rotate, convert, and organize your PDFs. All processing happens **client-side in your browser** - your files never leave your device.

**Live Demo:** https://imzhengyu.github.io/pdfbuddy/

## Features

### Merge PDFs
Combine multiple PDF files into one. Drag to reorder before merging.

### Split PDF
Extract specific pages from a PDF or split by page ranges (e.g., "1-3, 4-6, 7-end").

### Compress PDF
Reduce file size with quality options:
- **Low** - Maximum compression (smaller file)
- **Medium** - Balanced compression
- **High** - Best quality (larger file)

### Rotate PDF
Rotate individual pages by 90°, 180°, or 270°. Mirror pages horizontally or vertically.

### Convert to PDF
Convert images (PNG, JPEG) to PDF. Images are automatically scaled to fit A4 page size.

### Organize PDF
Delete pages or reorder pages in your PDF.

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

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
