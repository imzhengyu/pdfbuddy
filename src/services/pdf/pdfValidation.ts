import { PDFProcessingError } from './types';

export function validatePDFFile(file: File): void {
  if (file.type !== 'application/pdf') {
    throw new PDFProcessingError(
      `${file.name} is not a valid PDF file`,
      'FILE_VALIDATION'
    );
  }
}

export function validatePageRange(
  range: { start: number; end: number },
  pageCount: number
): void {
  if (range.start < 1 || range.start > pageCount) {
    throw new PDFProcessingError(
      `Invalid page number: ${range.start}. File has ${pageCount} pages.`,
      'PAGE_RANGE'
    );
  }
  const end = range.end === -1 ? pageCount : range.end;
  if (end < range.start || end > pageCount) {
    throw new PDFProcessingError(
      `Invalid page range: ${range.start}-${range.end}`,
      'PAGE_RANGE'
    );
  }
}

export function validatePageIndex(
  index: number,
  pageCount: number,
  operation: string
): void {
  if (index < 0 || index >= pageCount) {
    throw new PDFProcessingError(
      `Invalid page index: ${index} for ${operation}`,
      'PAGE_RANGE'
    );
  }
}

export function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new PDFProcessingError(
      `${file.name} is not an image file`,
      'FORMAT'
    );
  }
}

export function validateImageFormat(file: File): void {
  if (file.type !== 'image/png' &&
      file.type !== 'image/jpeg' &&
      file.type !== 'image/jpg') {
    throw new PDFProcessingError(
      `Unsupported image format: ${file.type}. Only PNG and JPEG are supported.`,
      'FORMAT'
    );
  }
}

export function validatePageCount(pageCount: number, expected: number): void {
  if (pageCount !== expected) {
    throw new PDFProcessingError(
      `Expected ${expected} pages but got ${pageCount}`,
      'PAGE_RANGE'
    );
  }
}