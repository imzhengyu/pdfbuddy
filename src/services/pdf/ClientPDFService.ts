import { IPDFService, PageRange, PageRotation, PageOrder, ProcessingProgress, CompressionQuality } from './types';
import { mergePdfs } from './mergeOperation';
import { splitPdf } from './splitOperation';
import { compressPdf } from './compressOperation';
import { rotatePdf } from './rotateOperation';
import { convertImagesToPdf, ConvertToPDFOptions, convertPdfToImages, ConvertToImagesOptions } from './convertOperation';
import { reorganizePdf } from './reorganizeOperation';
import { withRetry, isRetryFailure, RetryResult } from '../../utils/retry';
import { OPERATION_CONFIG, ERROR_CODES, ErrorCode } from '../../config/constants';

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
    _errorCode: ErrorCode = ERROR_CODES.PROCESSING_FAILED
  ): Promise<T> {
    const result: RetryResult<T> = await withRetry(operation, {
      maxAttempts: OPERATION_CONFIG.retryAttempts,
      delay: OPERATION_CONFIG.retryDelay,
      backoff: OPERATION_CONFIG.retryBackoff,
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
      ERROR_CODES.PROCESSING_FAILED
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
      ERROR_CODES.PROCESSING_FAILED
    );
  }

  /**
   * Compresses a PDF file with specified quality level.
   * @param file - PDF File to compress
   * @param quality - Compression quality level ('low', 'medium', 'high')
   * @param onProgress - Optional callback for progress updates
   * @returns Promise resolving to compressed PDF blob
   */
  async compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return this.executeWithRetry(
      () => compressPdf(file, quality, onProgress),
      ERROR_CODES.PROCESSING_FAILED
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
      ERROR_CODES.PROCESSING_FAILED
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
      ERROR_CODES.PROCESSING_FAILED
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
      ERROR_CODES.PROCESSING_FAILED
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
      ERROR_CODES.PROCESSING_FAILED
    );
  }
}