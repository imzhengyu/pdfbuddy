import { PDFDocument } from 'pdf-lib';
import { PDFProcessingError } from './types';
import { validateImageFile, validateImageFormat } from './pdfValidation';
import { ProgressCallback } from './pdfOperations';
import { CONST_CONVERT_CONFIG, CONST_MIME_TYPES } from '../../config';

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
  a4: CONST_CONVERT_CONFIG.pageSizes.a4,
  letter: CONST_CONVERT_CONFIG.pageSizes.letter,
};

const DEFAULT_OPTIONS: Required<ConvertToPDFOptions> = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: CONST_CONVERT_CONFIG.defaultMargin,
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

/**
 * Converts an array of image files into a single PDF document.
 * Validates image formats, scales images to fit the selected page size,
 * and reports progress as each image is processed.
 */
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

    if (file.type === CONST_MIME_TYPES.png) {
      image = await mergedPdf.embedPng(arrayBuffer);
    } else if (file.type === CONST_MIME_TYPES.jpeg || file.type === 'image/jpg') {
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
  return new Blob([new Uint8Array(pdfBytes)], { type: CONST_MIME_TYPES.pdf });
}
