/**
 * Represents a range of pages to process (inclusive).
 */
export interface PageRange {
  /** Starting page number (1-based) */
  start: number;
  /** Ending page number (inclusive), or -1 for "to end of document" */
  end: number;
}

/** Rotation angle in degrees - only supports 0, 90, 180, or 270 */
export type RotationType = 0 | 90 | 180 | 270;

/** Mirror axis direction */
export type MirrorType = 'horizontal' | 'vertical';

/**
 * Specifies a rotation or mirror operation on a single page.
 */
export interface PageRotation {
  /** 0-based index of the page to transform */
  pageIndex: number;
  /** Type of transformation to apply */
  type: 'rotate' | 'mirror';
  /** Rotation degrees (required for 'rotate' type, must be RotationType) */
  degrees?: RotationType;
  /** Mirror axis (required for 'mirror' type) */
  mirror?: MirrorType;
}

/**
 * Maps an original page position to a new position during reorganization.
 */
export interface PageOrder {
  /** Original 0-based page index */
  originalIndex: number;
  /** New 0-based position after reordering */
  newIndex: number;
}

/**
 * Progress information for long-running PDF operations.
 */
export interface ProcessingProgress {
  /** Current unit of work completed */
  current: number;
  /** Total units of work to complete */
  total: number;
  /** Percentage of completion (0-100) */
  percent: number;
}

/**
 * Represents a loaded PDF document with metadata and optional thumbnails.
 */
export interface PDFDocument {
  /** Source PDF file */
  file: File;
  /** Total number of pages in the document */
  pageCount: number;
  /** Optional array of base64-encoded page thumbnails */
  pages?: string[];
}

/**
 * Result of a PDF split operation containing the output blob with name metadata.
 */
export interface SplitResult {
  /** Suggested filename for the split part */
  name: string;
  /** PDF blob data for this split part */
  blob: Blob;
}

/**
 * Options for PDF to image conversion.
 */
export interface ConversionOptions {
  /** Output image format */
  format: 'png' | 'jpeg';
  /** Quality level for JPEG output (0-1), ignored for PNG */
  quality?: number;
}

/** Compression quality level presets */
export type CompressionQuality = 'low' | 'medium' | 'high';

/**
 * Interface for PDF operations implemented by ClientPDFService.
 * Defines the contract for all PDF manipulation operations.
 */
export interface IPDFService {
  /**
   * Merges multiple PDF files into a single document.
   * @param files - Array of PDF files to merge in order
   * @param onProgress - Optional progress callback
   * @returns Merged PDF as a Blob
   */
  merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;

  /**
   * Splits a PDF file at specified page ranges.
   * @param file - Source PDF file
   * @param pageRanges - Array of page ranges to extract
   * @param onProgress - Optional progress callback
   * @returns Array of PDF blobs, one per range
   */
  split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]>;

  /**
   * Compresses a PDF file with quality preset.
   * @param file - Source PDF file
   * @param quality - Compression quality level
   * @param onProgress - Optional progress callback
   * @returns Compressed PDF as a Blob
   */
  compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;

  /**
   * Rotates specified pages in a PDF.
   * @param file - Source PDF file
   * @param rotations - Array of rotation specifications
   * @param onProgress - Optional progress callback
   * @returns PDF with rotated pages as a Blob
   */
  rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;

  /**
   * Converts PDF pages to images.
   * @param file - Source PDF file
   * @param options - Conversion format and quality options
   * @param onProgress - Optional progress callback
   * @returns Array of image blobs, one per page
   */
  convertToImages(
    file: File,
    options?: { format?: 'png' | 'jpeg'; quality?: number; scale?: number },
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<Blob[]>;

  /**
   * Converts image files to a single PDF.
   * @param imageFiles - Array of image files in order
   * @param onProgress - Optional progress callback
   * @param options - Optional PDF page settings
   * @returns PDF containing all images as a Blob
   */
  convertToPDF(
    imageFiles: File[],
    onProgress?: (progress: ProcessingProgress) => void,
    options?: { pageSize?: 'a4' | 'letter' | 'original'; orientation?: 'portrait' | 'landscape'; margin?: number; fitMode?: 'fit' | 'stretch' | 'original' }
  ): Promise<Blob>;

  /**
   * Reorganizes pages in a PDF according to new order.
   * @param file - Source PDF file
   * @param newOrder - Array mapping original to new positions
   * @param onProgress - Optional progress callback
   * @returns Reorganized PDF as a Blob
   */
  reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
}

/**
 * Custom error class for PDF processing operations.
 * Includes error codes for programmatic error handling.
 */
export class PDFProcessingError extends Error {
  /**
   * Creates a PDFProcessingError with message, code, and optional recovery hint.
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param recovery - Optional suggestion for recovery action
   */
  constructor(
    message: string,
    public code: 'FILE_VALIDATION' | 'FILE_SIZE' | 'PAGE_RANGE' | 'FORMAT' | 'PROCESSING' | 'DOWNLOAD',
    public recovery?: string
  ) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}