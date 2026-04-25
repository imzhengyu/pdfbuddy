import { PDFDocument } from 'pdf-lib';
import { validatePDFFile } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';

export async function mergePdfs(
  files: File[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error('At least 2 files are required to merge');
  }

  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    validatePDFFile(file);

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await withPDFLibFallback(
      async () => loadPDFFromArrayBuffer(arrayBuffer),
      undefined,
      'PDFKit merge'
    );

    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}