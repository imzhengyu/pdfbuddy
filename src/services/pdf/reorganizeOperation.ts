import { PDFDocument } from 'pdf-lib';
import { PageOrder, PDFProcessingError } from './types';
import { validatePDF, validatePageIndex } from './pdfValidation';
import { ProgressCallback, savePDFToBlob } from './pdfOperations';
import { CONST_ERROR_MESSAGES } from '../../config';

/**
 * Rebuilds a PDF with its pages in the requested order.
 *
 * The empty-order check runs before anything else so a nonsensical request fails
 * immediately, and the whole selection is copied in one call.
 */
export async function reorganizePdf(
  file: File,
  newOrder: PageOrder[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  if (newOrder.length === 0) {
    throw new PDFProcessingError(CONST_ERROR_MESSAGES.reorganizeEmptyOrder, 'PAGE_RANGE');
  }

  const validation = await validatePDF(file, 'full');
  if (!validation.valid || !validation.document) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validation.errors.join('; ')));
  }

  const pdf = validation.document;
  const pageCount = pdf.getPageCount();

  for (const order of newOrder) {
    validatePageIndex(order.originalIndex, pageCount, 'reorganize');
  }

  const sortedOrder = [...newOrder].sort((a, b) => a.newIndex - b.newIndex);
  const total = sortedOrder.length;

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, sortedOrder.map((order) => order.originalIndex));
  pages.forEach((page) => newPdf.addPage(page));

  onProgress?.({ current: total, total, percent: 100 });

  return savePDFToBlob(newPdf);
}
