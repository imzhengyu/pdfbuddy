import { PDFDocument } from 'pdf-lib';
import { PDFProcessingError } from './types';
import { validateImageFile, validateImageFormat } from './pdfValidation';
import { ProgressCallback } from './pdfOperations';
import { PDF_CONFIG } from '../../config';

/** Supported output page sizes. */
export type PageSize = 'a4' | 'letter' | 'original';

/** Page orientation. */
export type PageOrientation = 'portrait' | 'landscape';

/** How the image should be placed on the page. */
export type ImageFitMode = 'fit' | 'stretch' | 'original';

/** Options for converting images to PDF. */
export interface ConvertToPDFOptions {
  /** Page size preset. */
  pageSize?: PageSize;
  /** Page orientation. */
  orientation?: PageOrientation;
  /** Margin in points (72 DPI). */
  margin?: number;
  /** How images are scaled on the page. */
  fitMode?: ImageFitMode;
}

// Page sizes in points (72 DPI)
const PAGE_SIZES: Record<Exclude<PageSize, 'original'>, { width: number; height: number }> = {
  a4: { width: 595, height: 842 },
  letter: { width: 612, height: 792 },
};

const DEFAULT_OPTIONS: Required<ConvertToPDFOptions> = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 20,
  fitMode: 'fit',
};

function getPageDimensions(
  pageSize: PageSize,
  orientation: PageOrientation,
  imageWidth: number,
  imageHeight: number
): { width: number; height: number } {
  if (pageSize === 'original') {
    return orientation === 'landscape'
      ? { width: Math.max(imageWidth, imageHeight), height: Math.min(imageWidth, imageHeight) }
      : { width: Math.min(imageWidth, imageHeight), height: Math.max(imageWidth, imageHeight) };
  }

  const size = PAGE_SIZES[pageSize];
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return size;
}

function scaleImage(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
  fitMode: ImageFitMode
): { width: number; height: number } {
  if (fitMode === 'original') {
    return { width: imageWidth, height: imageHeight };
  }

  if (fitMode === 'stretch') {
    return { width: Math.round(maxWidth), height: Math.round(maxHeight) };
  }

  // fit mode: scale to fit while preserving aspect ratio
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
  onProgress?: ProgressCallback,
  options: ConvertToPDFOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
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

    const { width: pageWidth, height: pageHeight } = getPageDimensions(
      opts.pageSize,
      opts.orientation,
      image.width,
      image.height
    );

    const maxWidth = Math.max(1, pageWidth - opts.margin * 2);
    const maxHeight = Math.max(1, pageHeight - opts.margin * 2);
    const scaled = scaleImage(image.width, image.height, maxWidth, maxHeight, opts.fitMode);

    const page = mergedPdf.addPage([pageWidth, pageHeight]);

    const x = (pageWidth - scaled.width) / 2;
    const y = (pageHeight - scaled.height) / 2;

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

/** Options for converting PDF pages to images. */
export interface ConvertToImagesOptions {
  /** Output image format. */
  format?: 'png' | 'jpeg';
  /** JPEG quality (0-1), ignored for PNG. */
  quality?: number;
  /** Rendering scale factor. Higher values produce larger images. */
  scale?: number;
}

const DEFAULT_IMAGE_OPTIONS: Required<ConvertToImagesOptions> = {
  format: 'png',
  quality: 0.92,
  scale: 2,
};

/**
 * Converts a PDF file to an array of image blobs using pdfjs-dist.
 * Runs entirely in the browser.
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: ProgressCallback,
  options: ConvertToImagesOptions = {}
): Promise<Blob[]> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_CONFIG.pdfJsWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = pdf.numPages;
  const images: Blob[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: opts.scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new PDFProcessingError('Failed to create canvas context', 'PROCESSING');
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
        mimeType,
        opts.format === 'jpeg' ? opts.quality : undefined
      );
    });

    images.push(blob);

    onProgress?.({
      current: i,
      total,
      percent: Math.round((i / total) * 100),
    });
  }

  return images;
}

export function pdfToImagesNotSupported(): never {
  throw new PDFProcessingError(
    'PDF to image conversion requires the backend service. This feature is coming soon.',
    'PROCESSING',
    'Use the backend API for PDF to image conversion'
  );
}
