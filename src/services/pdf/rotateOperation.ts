import { degrees } from 'pdf-lib';
import { PageRotation } from './types';
import { validatePDFFile, validatePageIndex } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';

export async function rotatePdf(
  file: File,
  rotations: PageRotation[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  validatePDFFile(file);

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await withPDFLibFallback(
    async () => loadPDFFromArrayBuffer(arrayBuffer),
    undefined,
    'PDFKit rotate'
  );

  const pages = pdf.getPages();
  const pageCount = pages.length;

  for (const rotation of rotations) {
    validatePageIndex(rotation.pageIndex, pageCount, 'rotate');

    const page = pages[rotation.pageIndex];
    const currentRotation = page.getRotation().angle;
    const newRotation = (currentRotation + rotation.degrees) % 360;
    page.setRotation(degrees(newRotation));

    onProgress?.({
      current: rotation.pageIndex + 1,
      total: rotations.length,
      percent: Math.round(((rotation.pageIndex + 1) / rotations.length) * 100)
    });
  }

  const pdfBytes = await pdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}