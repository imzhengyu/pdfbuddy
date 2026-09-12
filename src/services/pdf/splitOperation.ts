import { PDFDocument } from 'pdf-lib';
import { PageRange } from './types';
import { validatePDF, validatePageRange } from './pdfValidation';
import { ProgressCallback, savePDFToBlob } from './pdfOperations';
import { CONST_ERROR_MESSAGES } from '../../config';

/**
 * Splits a PDF into one document per requested page range.
 *
 * Structure validation already parsed the file, so that document is reused. Each
 * range is copied in a single `copyPages` call rather than one call per page.
 */
export async function splitPdf(
  file: File,
  pageRanges: PageRange[],
  onProgress?: ProgressCallback
): Promise<Blob[]> {
  const validation = await validatePDF(file, 'full');
  if (!validation.valid || !validation.document) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validation.errors.join('; ')));
  }

  const pdf = validation.document;
  const pageCount = pdf.getPageCount();

  for (const range of pageRanges) {
    validatePageRange(range, pageCount);
  }

  const results: Blob[] = [];
  const total = pageRanges.length;

  for (let i = 0; i < pageRanges.length; i++) {
    const range = pageRanges[i];
    const end = range.end === -1 ? pageCount : range.end;

    const indices: number[] = [];
    for (let pageIdx = range.start - 1; pageIdx < end; pageIdx++) {
      indices.push(pageIdx);
    }

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, indices);
    pages.forEach((page) => newPdf.addPage(page));

    results.push(await savePDFToBlob(newPdf));

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  return results;
}
