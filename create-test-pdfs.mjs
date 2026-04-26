import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function createPDF(filename, pageCount, content) {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 50,
      y: height - 100,
      width: width - 100,
      height: 80,
      color: rgb(0.1, 0.3, 0.8),
    });

    page.drawText(`${content} - Page ${i}`, {
      x: 60,
      y: height - 70,
      size: 20,
      font: helvetica,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Test file: ${filename}`, {
      x: 60,
      y: height - 120,
      size: 14,
      font: helvetica,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 60,
      y: height - 150,
      size: 12,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    for (let j = 0; j < 5; j++) {
      page.drawText(`Lorem ipsum dolor sit amet consectetur. Line ${j + 1}`, {
        x: 60,
        y: height - 200 - (j * 25),
        size: 12,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function main() {
  const files = [
    { name: 'test-1page.pdf', pages: 1, content: 'Single Page Document' },
    { name: 'test-2pages.pdf', pages: 2, content: 'Two Page Document' },
    { name: 'test-3pages.pdf', pages: 3, content: 'Three Page Document' },
    { name: 'test-5pages.pdf', pages: 5, content: 'Five Page Document' },
    { name: 'test-10pages.pdf', pages: 10, content: 'Ten Page Document' },
    { name: 'merge-1.pdf', pages: 2, content: 'Merge Test File 1' },
    { name: 'merge-2.pdf', pages: 3, content: 'Merge Test File 2' },
    { name: 'merge-3.pdf', pages: 1, content: 'Merge Test File 3' },
    { name: 'split-source.pdf', pages: 5, content: 'Split Source Document' },
    { name: 'rotate-test.pdf', pages: 3, content: 'Rotate Test Document' },
  ];

  for (const file of files) {
    const buffer = await createPDF(file.name, file.pages, file.content);
    fs.writeFileSync(`test-pdfs/${file.name}`, buffer);
    console.log(`Created: test-pdfs/${file.name} (${file.pages} pages)`);
  }

  console.log('\nAll 10 test PDFs created successfully!');
}

main().catch(console.error);