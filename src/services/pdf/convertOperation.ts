import { PDFDocument } from 'pdf-lib';
import { PDFProcessingError } from './types';
import { validateImageFile, validateImageFormat } from './pdfValidation';
import { ProgressCallback } from './pdfOperations';

// A4 page size in points (72 DPI)
const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const A4_MARGIN = 20;

function scaleImageToFitA4(imageWidth: number, imageHeight: number): { width: number; height: number } {
  const maxWidth = A4_WIDTH - A4_MARGIN * 2;
  const maxHeight = A4_HEIGHT - A4_MARGIN * 2;

  const aspectRatio = imageWidth / imageHeight;

  let scaledWidth = maxWidth;
  let scaledHeight = scaledWidth / aspectRatio;

  if (scaledHeight > maxHeight) {
    scaledHeight = maxHeight;
    scaledWidth = scaledHeight * aspectRatio;
  }

  return { width: Math.round(scaledWidth), height: Math.round(scaledHeight) };
}

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

    const scaled = scaleImageToFitA4(image.width, image.height);
    const page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);

    const x = (A4_WIDTH - scaled.width) / 2;
    const y = (A4_HEIGHT - scaled.height) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaled.width,
      height: scaled.height
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