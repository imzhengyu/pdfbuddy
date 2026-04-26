import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './test-pdfs';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const testPdfs = [
  { name: 'test-1page.pdf', pages: 1, label: 'TEST PAGE 1', color: rgb(1, 1, 0) }, // Yellow
  { name: 'test-2pages.pdf', pages: 2, label: 'TEST PAGE', color: rgb(0, 1, 0) }, // Green
  { name: 'test-3pages.pdf', pages: 3, label: 'TEST PAGE', color: rgb(0, 0, 1) }, // Blue
  { name: 'test-5pages.pdf', pages: 5, label: 'TEST PAGE', color: rgb(1, 0.65, 0) }, // Orange
  { name: 'test-10pages.pdf', pages: 10, label: 'TEST PAGE', color: rgb(0.5, 0, 0.5) }, // Purple
  { name: 'merge-1.pdf', pages: 2, label: 'MERGE FILE 1', color: rgb(1, 0, 0) }, // Red
  { name: 'merge-2.pdf', pages: 3, label: 'MERGE FILE 2', color: rgb(1, 0.75, 0.8) }, // Pink
  { name: 'merge-3.pdf', pages: 1, label: 'MERGE FILE 3', color: rgb(0, 1, 1) }, // Cyan
  { name: 'split-source.pdf', pages: 5, label: 'SPLIT SOURCE', color: rgb(0.5, 0.5, 0.5) }, // Gray
  { name: 'rotate-test.pdf', pages: 3, label: 'ROTATE TEST', color: rgb(1, 1, 1) }, // White
];

async function generatePDF(config) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { name, pages, label, color } = config;

  for (let i = 1; i <= pages; i++) {
    const page = pdfDoc.addPage([300, 200]);

    // Draw colored background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      color: color,
    });

    // Draw text
    const text = pages > 1 ? `${label}` : label;
    const pageText = i === 1 && pages > 1 ? `${text} ${i}` : text;

    const textWidth = boldFont.widthOfTextAtSize(pageText, 24);
    page.drawText(pageText, {
      x: (300 - textWidth) / 2,
      y: 100,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw page number
    const pageNumText = `Page ${i} of ${pages}`;
    const pageNumWidth = boldFont.widthOfTextAtSize(pageNumText, 12);
    page.drawText(pageNumText, {
      x: (300 - pageNumWidth) / 2,
      y: 60,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const filePath = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`Generated: ${filePath}`);
}

async function main() {
  console.log('Generating test PDFs...');
  for (const config of testPdfs) {
    await generatePDF(config);
  }
  console.log('Done!');
}

main().catch(console.error);