import { PDFDocument, degrees } from 'pdf-lib';
import { PageRotation } from './types';
import { validatePDFFile, validatePageIndex } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';

export async function rotatePdf(
  file: File,
  rotations: PageRotation[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  validatePDFFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await loadPDFFromArrayBuffer(arrayBuffer);
  const pageCount = sourcePdf.getPageCount();

  // Validate all page indices first
  for (const rotation of rotations) {
    validatePageIndex(rotation.pageIndex, pageCount, 'rotate');
  }

  // Create a new PDF with all pages, applying transformations
  const newPdf = await PDFDocument.create();
  const rotatedIndices = new Set(rotations.map(r => r.pageIndex));

  // First, add all non-rotated pages
  for (let i = 0; i < pageCount; i++) {
    if (!rotatedIndices.has(i)) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
      newPdf.addPage(copiedPage);
    }
  }

  // Then, add transformed pages
  for (let i = 0; i < rotations.length; i++) {
    const rotation = rotations[i];
    const { pageIndex, type, degrees: deg } = rotation;

    if (type === 'mirror') {
      // Mirror not directly supported in pdf-lib - skip for now
      // Copy page as-is without mirror transformation
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
      newPdf.addPage(copiedPage);
    } else {
      // For rotation, copy page and apply rotation
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
      const currentRotation = copiedPage.getRotation().angle;
      const newRotation = (currentRotation + (deg || 0)) % 360;
      copiedPage.setRotation(degrees(newRotation));
      newPdf.addPage(copiedPage);
    }

    onProgress?.({
      current: i + 1,
      total: rotations.length,
      percent: Math.round(((i + 1) / rotations.length) * 100)
    });
  }

  const pdfBytes = await newPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}