import { PDFDocument, degrees } from 'pdf-lib';
import { PageRotation } from './types';
import { validatePDF, validatePageIndex } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { CONST_ERROR_MESSAGES, CONST_MIME_TYPES } from '../../config';

export async function rotatePdf(
  file: File,
  rotations: PageRotation[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Validate PDF structure using full validation
  const validationResult = await validatePDF(file, 'full');
  if (!validationResult.valid) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validationResult.errors.join('; ')));
  }

  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await loadPDFFromArrayBuffer(arrayBuffer);
  const pageCount = sourcePdf.getPageCount();

  // Validate all page indices first
  for (const rotation of rotations) {
    validatePageIndex(rotation.pageIndex, pageCount, 'rotate');
  }

  // Build a map of pageIndex -> rotation for quick lookup
  const rotationMap = new Map<number, PageRotation>();
  for (const rotation of rotations) {
    rotationMap.set(rotation.pageIndex, rotation);
  }

  // Create a new PDF with all pages in correct order, applying transformations
  const newPdf = await PDFDocument.create();

  // Process pages in order, inserting rotated pages in their original positions
  for (let i = 0; i < pageCount; i++) {
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);

    const pageRotation = rotationMap.get(i);
    if (pageRotation) {
      const { type, degrees: deg } = pageRotation;

      if (type === 'mirror') {
        throw new Error(CONST_ERROR_MESSAGES.unsupportedRotation);
      }

      if (type === 'rotate' && deg !== undefined) {
        const currentRotation = copiedPage.getRotation().angle;
        const newRotation = (currentRotation + deg) % 360;
        copiedPage.setRotation(degrees(newRotation));
      }
    }

    newPdf.addPage(copiedPage);

    onProgress?.({
      current: i + 1,
      total: pageCount,
      percent: Math.round(((i + 1) / pageCount) * 100)
    });
  }

  const pdfBytes = await newPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: CONST_MIME_TYPES.pdf });
}
