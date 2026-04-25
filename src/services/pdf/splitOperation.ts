import { PDFDocument } from 'pdf-lib';
import { PageRange } from './types';
import { validatePDFFile, validatePageRange } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';

export async function splitPdf(
  file: File,
  pageRanges: PageRange[],
  onProgress?: ProgressCallback
): Promise<Blob[]> {
  validatePDFFile(file);

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await withPDFLibFallback(
    async () => loadPDFFromArrayBuffer(arrayBuffer),
    undefined,
    'PDFKit split'
  );

  const pageCount = pdf.getPageCount();

  for (const range of pageRanges) {
    validatePageRange(range, pageCount);
  }

  const results: Blob[] = [];
  const total = pageRanges.length;

  for (let i = 0; i < pageRanges.length; i++) {
    const range = pageRanges[i];
    const newPdf = await PDFDocument.create();
    const end = range.end === -1 ? pageCount : range.end;

    for (let pageIdx = range.start - 1; pageIdx < end; pageIdx++) {
      const [page] = await withPDFLibFallback(
        async () => newPdf.copyPages(pdf, [pageIdx]),
        undefined,
        'PDFKit copy page'
      );
      newPdf.addPage(page);
    }

    const pdfBytes = await newPdf.save();
    results.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  return results;
}