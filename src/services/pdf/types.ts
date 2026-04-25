export interface PageRange {
  start: number;
  end: number; // inclusive, or -1 for "to end"
}

export interface PageRotation {
  pageIndex: number;
  degrees: 0 | 90 | 180 | 270;
}

export interface PageOrder {
  originalIndex: number;
  newIndex: number;
}

export interface ProcessingProgress {
  current: number;
  total: number;
  percent: number;
}

export interface PDFDocument {
  file: File;
  pageCount: number;
  pages?: string[]; // base64 thumbnails
}

export interface SplitResult {
  name: string;
  blob: Blob;
}

export interface ConversionOptions {
  format: 'png' | 'jpeg';
  quality?: number; // for jpeg, 0-1
}

export type CompressionQuality = 'low' | 'medium' | 'high';

export interface IPDFService {
  merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]>;
  compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  convertToImages(file: File, options: ConversionOptions, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]>;
  convertToPDF(imageFiles: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
  reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob>;
}

export class PDFProcessingError extends Error {
  constructor(
    message: string,
    public code: 'FILE_VALIDATION' | 'FILE_SIZE' | 'PAGE_RANGE' | 'FORMAT' | 'PROCESSING' | 'DOWNLOAD',
    public recovery?: string
  ) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}