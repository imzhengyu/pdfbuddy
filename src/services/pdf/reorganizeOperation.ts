import { PDFDocument } from 'pdf-lib';
import { PageOrder, PDFProcessingError } from './types';
import { validatePDFFile, validatePageIndex } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';

export async function reorganizePdf(
  file: File,
  newOrder: PageOrder[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  validatePDFFile(file);

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
      'At least one page must be in the new order',
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
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}