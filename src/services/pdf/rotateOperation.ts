import { PDFDocument, degrees } from 'pdf-lib';
import { PageRotation } from './types';
import { validatePDF, validatePageIndex } from './pdfValidation';
import { ProgressCallback, savePDFToBlob } from './pdfOperations';
import { CONST_ERROR_MESSAGES } from '../../config';

/**
 * Applies per-page rotations, preserving page order.
 *
 * All input is validated before any page is copied, so an unsupported request
 * fails up front instead of after half the document has been built.
 */
export async function rotatePdf(
  file: File,
  rotations: PageRotation[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  const validation = await validatePDF(file, 'full');
  if (!validation.valid || !validation.document) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validation.errors.join('; ')));
  }

  const sourcePdf = validation.document;
  const pageCount = sourcePdf.getPageCount();

  const rotationMap = new Map<number, PageRotation>();
  for (const rotation of rotations) {
    validatePageIndex(rotation.pageIndex, pageCount, 'rotate');
    if (rotation.type === 'mirror') {
      throw new Error(CONST_ERROR_MESSAGES.unsupportedRotation);
    }
    rotationMap.set(rotation.pageIndex, rotation);
  }

  const newPdf = await PDFDocument.create();
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  const copiedPages = await newPdf.copyPages(sourcePdf, indices);

  for (let i = 0; i < copiedPages.length; i++) {
    const page = copiedPages[i];
    const rotation = rotationMap.get(i);

    if (rotation?.type === 'rotate' && rotation.degrees !== undefined) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotation.degrees) % 360));
    }

    newPdf.addPage(page);

    onProgress?.({
      current: i + 1,
      total: pageCount,
      percent: Math.round(((i + 1) / pageCount) * 100)
    });
  }

  return savePDFToBlob(newPdf);
}
