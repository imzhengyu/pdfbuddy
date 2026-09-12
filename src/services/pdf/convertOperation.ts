import { PDFProcessingError } from './types';
import { ProgressCallback } from './pdfOperations';
import { CONST_CONVERT_CONFIG, CONST_MIME_TYPES } from '../../config';
import { getPdfjsLib } from './pdfjsInitializer';
import { WorkerOutgoingMessage } from '../../workers/workerTypes';

export type { ConvertToPDFOptions, PageSize, PageOrientation, ImageFitMode } from './convertImagesToPdf';
export { convertImagesToPdf } from './convertImagesToPdf';

/** Options for converting PDF pages to images. */
export interface ConvertToImagesOptions {
  /** Output image format. */
  format?: 'png' | 'jpeg';
  /** JPEG quality (0-1), ignored for PNG. */
  quality?: number;
  /** Rendering scale factor. Higher values produce larger images. */
  scale?: number;
  /**
   * 1-based page numbers to render, in output order. Omit to render every page.
   * Rendering is the expensive part of this operation, so callers should pass
   * the user's actual selection instead of rasterising the whole document.
   */
  pages?: number[];
}

const DEFAULT_IMAGE_OPTIONS: Required<ConvertToImagesOptions> = {
  format: 'png',
  quality: CONST_CONVERT_CONFIG.defaultImageQuality,
  scale: CONST_CONVERT_CONFIG.defaultImageScale,
  pages: [],
};

/**
 * Normalises the requested pages: de-duplicated, ascending and clamped to the
 * document. An empty request means "every page".
 */
function resolvePages(pages: number[] | undefined, pageCount: number): number[] {
  if (!pages || pages.length === 0) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  return [...new Set(pages)]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
    .sort((a, b) => a - b);
}

/**
 * Converts a PDF file to an array of image blobs using pdfjs-dist.
 * Runs entirely in the browser.
 */
async function convertPdfToImagesMainThread(
  file: File,
  onProgress?: ProgressCallback,
  options: ConvertToImagesOptions = {}
): Promise<Blob[]> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options };

  const pdfjsLib = await getPdfjsLib();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const requestedPages = resolvePages(options.pages, pdf.numPages);
  const total = requestedPages.length;
  const images: Blob[] = [];

  for (let i = 0; i < total; i++) {
    const page = await pdf.getPage(requestedPages[i]);
    const viewport = page.getViewport({ scale: opts.scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new PDFProcessingError('Failed to create canvas context', 'PROCESSING');
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    const mimeType = opts.format === 'jpeg' ? CONST_MIME_TYPES.jpeg : CONST_MIME_TYPES.png;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
        mimeType,
        opts.format === 'jpeg' ? opts.quality : undefined
      );
    });

    images.push(blob);

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });
  }

  return images;
}

/**
 * Attempts to convert a PDF to images inside a Web Worker using OffscreenCanvas.
 * Falls back to main-thread rendering if the worker is unavailable or fails.
 */
async function convertPdfToImagesViaWorker(
  file: File,
  onProgress?: ProgressCallback,
  options: ConvertToImagesOptions = {}
): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../../workers/pdfProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    const id = crypto.randomUUID();

    worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
      const message = event.data;
      if (message.id !== id) return;

      switch (message.type) {
        case 'progress':
          onProgress?.(message.progress);
          break;
        case 'success':
          worker.terminate();
          resolve(message.result as Blob[]);
          break;
        case 'error':
          worker.terminate();
          reject(new Error(message.error));
          break;
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({
      id,
      operation: 'convertToImages',
      payload: { file, options },
    });
  });
}

/**
 * Converts a PDF file to an array of image blobs.
 * Routes to a Web Worker when supported; otherwise renders on the main thread.
 */
export async function convertPdfToImages(
  file: File,
  onProgress?: ProgressCallback,
  options: ConvertToImagesOptions = {}
): Promise<Blob[]> {
  const canUseWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

  if (canUseWorker) {
    try {
      return await convertPdfToImagesViaWorker(file, onProgress, options);
    } catch {
      // Fall through to main-thread rendering
    }
  }

  return convertPdfToImagesMainThread(file, onProgress, options);
}

export function pdfToImagesNotSupported(): never {
  throw new PDFProcessingError(
    'PDF to image conversion requires the backend service. This feature is coming soon.',
    'PROCESSING',
    'Use the backend API for PDF to image conversion'
  );
}
