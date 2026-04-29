import { PDFDocument } from 'pdf-lib';
import { validatePDFFile } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback, PDFLibError } from './pdfFallback';

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

    let pdf;
    try {
      const arrayBuffer = await file.arrayBuffer();

      pdf = await withPDFLibFallback(
        async () => loadPDFFromArrayBuffer(arrayBuffer),
        undefined,
        'PDFKit merge'
      );

      // copyPages can also throw PDFDict2 errors
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } catch (err) {
      let errorMessage = 'Unknown error';
      if (err instanceof PDFLibError && err.originalError) {
        errorMessage = err.originalError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      throw new Error(`Failed to process "${file.name}": ${errorMessage}`);
    }

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}