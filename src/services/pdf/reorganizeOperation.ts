import { PDFDocument } from 'pdf-lib';
import { PageOrder, PDFProcessingError } from './types';
import { validatePDF, validatePageIndex } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';
import { CONST_ERROR_MESSAGES, CONST_MIME_TYPES } from '../../config';

export async function reorganizePdf(
  file: File,
  newOrder: PageOrder[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Validate PDF structure using full validation
  const validationResult = await validatePDF(file, 'full');
  if (!validationResult.valid) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validationResult.errors.join('; ')));
  }

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await withPDFLibFallback(
    async () => loadPDFFromArrayBuffer(arrayBuffer),
    undefined,
    'PDFKit reorganize'
  );

  const pageCount = pdf.getPageCount();

  const validIndices = new Set<number>();
  for (const order of newOrder) {
    validatePageIndex(order.originalIndex, pageCount, 'reorganize');
    validIndices.add(order.originalIndex);
  }

  if (newOrder.length === 0) {
    throw new PDFProcessingError(
      CONST_ERROR_MESSAGES.reorganizeEmptyOrder,
      'PAGE_RANGE'
    );
  }

  const newPdf = await PDFDocument.create();
  const sortedOrder = [...newOrder].sort((a, b) => a.newIndex - b.newIndex);
  const total = sortedOrder.length;

  for (let i = 0; i < sortedOrder.length; i++) {
    const [page] = await withPDFLibFallback(
      async () => newPdf.copyPages(pdf, [sortedOrder[i].originalIndex]),
      undefined,
      'PDFKit copy page'
    );
    newPdf.addPage(page);

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  const pdfBytes = await newPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: CONST_MIME_TYPES.pdf });
}