import { PDFDocument } from 'pdf-lib';
import { validatePDF } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback, PDFLibError } from './pdfFallback';
import { CONST_ERROR_MESSAGES, CONST_MIME_TYPES } from '../../config';

export async function mergePdfs(
  files: File[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (files.length < 2) {
    throw new Error(CONST_ERROR_MESSAGES.mergeMinFiles);
  }

  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate PDF structure using full validation
    const validationResult = await validatePDF(file, 'full');
    if (!validationResult.valid) {
      throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validationResult.errors.join('; ')));
    }

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
      let errorMessage: string = CONST_ERROR_MESSAGES.defaultError;
      if (err instanceof PDFLibError && err.originalError) {
        errorMessage = err.originalError.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      throw new Error(CONST_ERROR_MESSAGES.failedToProcess(file.name, errorMessage));
    }

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: CONST_MIME_TYPES.pdf });
}