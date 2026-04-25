import { PDFDocument } from 'pdf-lib';
import { PDFProcessingError } from './types';
import { validateImageFile, validateImageFormat } from './pdfValidation';
import { ProgressCallback } from './pdfOperations';

export async function convertImagesToPdf(
  imageFiles: File[],
  onProgress?: ProgressCallback
): Promise<Blob> {
  const mergedPdf = await PDFDocument.create();
  const total = imageFiles.length;

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    validateImageFile(file);
    validateImageFormat(file);

    const arrayBuffer = await file.arrayBuffer();
    let image;

    if (file.type === 'image/png') {
      image = await mergedPdf.embedPng(arrayBuffer);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await mergedPdf.embedJpg(arrayBuffer);
    } else {
      throw new PDFProcessingError(
        `Unsupported image format: ${file.type}. Only PNG and JPEG are supported.`,
        'FORMAT'
      );
    }

    const page = mergedPdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100)
    });
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}

export function pdfToImagesNotSupported(): never {
  throw new PDFProcessingError(
    'PDF to image conversion requires the backend service. This feature is coming soon.',
    'PROCESSING',
    'Use the backend API for PDF to image conversion'
  );
}