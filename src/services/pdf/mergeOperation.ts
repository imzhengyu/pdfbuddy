import { PDFDocument } from 'pdf-lib';
import { validatePDF } from './pdfValidation';
import { ProgressCallback, savePDFToBlob } from './pdfOperations';
import { withPDFLibFallback, PDFLibError } from './pdfFallback';
import { CONST_ERROR_MESSAGES } from '../../config';

/**
 * Merges the given PDFs, in order, into a single document.
 *
 * `validatePDF(..., 'full')` already parses the file to check its structure, so
 * the parsed document is reused here instead of loading it a second time.
 */
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

    const validation = await validatePDF(file, 'full');
    if (!validation.valid || !validation.document) {
      throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validation.errors.join('; ')));
    }

    const sourcePdf = validation.document;

    try {
      const pages = await withPDFLibFallback(() =>
        mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
      );
      pages.forEach((page) => mergedPdf.addPage(page));
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

  return savePDFToBlob(mergedPdf);
}