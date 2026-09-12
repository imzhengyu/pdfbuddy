import { IPDFService, PageRange, PageRotation, PageOrder, ProcessingProgress } from './types';
import { mergePdfs } from './mergeOperation';
import { splitPdf } from './splitOperation';
import { rotatePdf } from './rotateOperation';
import { convertImagesToPdf, ConvertToPDFOptions, convertPdfToImages, ConvertToImagesOptions } from './convertOperation';
import { reorganizePdf } from './reorganizeOperation';
import { withRetry, isRetryFailure, RetryResult } from '../../utils/retry';
import { CONST_OPERATION_CONFIG, CONST_ERROR_CODES, ErrorCode } from '../../config';

/**
 * Client-side PDF service that wraps pdf-lib operations with retry logic.
 * Implements IPDFService interface for consistent API across views.
 * Uses exponential backoff retry for robustness against network issues.
 */
export class ClientPDFService implements IPDFService {
  /**
   * Executes an operation with retry logic using exponential backoff.
   * @template T - Return type of the operation
   * @param operation - Async function to execute
   * @param errorCode - Error code to attach on failure
   * @returns Result of the operation after successful retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    _errorCode: ErrorCode = CONST_ERROR_CODES.PROCESSING_FAILED
  ): Promise<T> {
    const result: RetryResult<T> = await withRetry(operation, {
      maxAttempts: CONST_OPERATION_CONFIG.retryAttempts,
      delay: CONST_OPERATION_CONFIG.retryDelay,
      backoff: CONST_OPERATION_CONFIG.retryBackoff,
      context: _errorCode,
    });

    if (isRetryFailure(result) && result.error) {
      throw result.error;
    }

    if (!result.result) {
      throw new Error('Operation failed');
    }

    return result.result;
  }

  /**
   * Merges multiple PDF files into a single PDF document.
   * @param files - Array of PDF File objects to merge
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to merged PDF blob
   */
  async merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return this.executeWithRetry(
      () => mergePdfs(files, onProgress),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Splits a PDF file at specified page ranges.
   * @param file - PDF File to split
   * @param pageRanges - Array of page ranges (start/end) for each split
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to array of split PDF blobs
   */
  async split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    return this.executeWithRetry(
      () => splitPdf(file, pageRanges, onProgress),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Rotates specified pages in a PDF file.
   * @param file - PDF File containing pages to rotate
   * @param rotations - Array of PageRotation specifying pages and rotation degrees
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to PDF blob with rotated pages
   */
  async rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return this.executeWithRetry(
      () => rotatePdf(file, rotations, onProgress),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Converts a PDF file to images using pdfjs-dist rendering.
   * @param file - PDF File to convert
   * @param options - Conversion format, quality, and scale options
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to array of image blobs, one per page
   */
  async convertToImages(file: File, options?: ConvertToImagesOptions, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    return this.executeWithRetry(
      () => convertPdfToImages(file, onProgress, options),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Converts image files into a single PDF document.
   * @param imageFiles - Array of image File objects (JPEG, PNG, etc.)
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to PDF blob containing images
   */
  async convertToPDF(
    imageFiles: File[],
    onProgress?: (progress: ProcessingProgress) => void,
    options?: ConvertToPDFOptions
  ): Promise<Blob> {
    return this.executeWithRetry(
      () => convertImagesToPdf(imageFiles, onProgress, options),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Reorganizes pages in a PDF according to new order specification.
   * @param file - PDF File to reorganize
   * @param newOrder - Array of PageOrder specifying original and new positions
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to reorganized PDF blob
   */
  async reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return this.executeWithRetry(
      () => reorganizePdf(file, newOrder, onProgress),
      CONST_ERROR_CODES.PROCESSING_FAILED
    );
  }
}

let clientPDFServiceInstance: ClientPDFService | null = null;

/**
 * Returns a singleton ClientPDFService instance.
 * The service has no mutable instance state, so a single instance can be reused.
 */
export function getClientPDFService(): ClientPDFService {
  if (!clientPDFServiceInstance) {
    clientPDFServiceInstance = new ClientPDFService();
  }
  return clientPDFServiceInstance;
}