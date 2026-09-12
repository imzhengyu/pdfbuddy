import { CONST_PDF_CONFIG } from '../../config';

let pdfjsLibPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Returns a cached Promise for the pdfjs-dist module.
 * Sets GlobalWorkerOptions.workerSrc exactly once on first import.
 */
export function getPdfjsLib(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = CONST_PDF_CONFIG.pdfJsWorkerUrl;
      return lib;
    });
  }
  return pdfjsLibPromise;
}
