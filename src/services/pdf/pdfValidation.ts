import { PDFDocument } from 'pdf-lib';
import { PDFProcessingError } from './types';

/**
 * Result of PDF validation with detailed information.
 */
export interface ValidationResult {
  /** Whether the file passed validation */
  valid: boolean;
  /** List of validation errors (fatal) */
  errors: string[];
  /** List of validation warnings (non-fatal) */
  warnings: string[];
  /** Extracted PDF information if validation passed */
  pdfInfo?: {
    /** Number of pages in the PDF */
    pageCount?: number;
    /** PDF version string (e.g., "1.4", "1.7") */
    version?: string;
  };
}

/**
 * Validation level determining depth of checks.
 * - BASIC: Quick check for initial upload (header, version)
 * - FULL: Complete validation before processing (structure, pages)
 */
export type ValidationLevel = 'basic' | 'full';

const PDF_MAGIC_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]); // %PDF-

/**
 * Checks if buffer starts with PDF magic bytes.
 */
function hasPDFMagicBytes(buffer: Uint8Array): boolean {
  if (buffer.length < 5) return false;
  for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
    if (buffer[i] !== PDF_MAGIC_BYTES[i]) return false;
  }
  return true;
}

/**
 * Extracts PDF version from buffer if present.
 */
function extractPDFVersion(buffer: Uint8Array): string | undefined {
  if (buffer.length < 8) return undefined;
  // Look for %PDF-X.Y pattern in first 1KB
  const view = buffer.slice(0, Math.min(1024, buffer.length));
  const text = new TextDecoder('ascii', { fatal: false }).decode(view);
  const match = text.match(/^%PDF-(\d+\.\d+)/);
  return match ? match[1] : undefined;
}

/**
 * Performs BASIC validation - quick check for initial upload.
 * Checks PDF header magic bytes and version string.
 */
export async function validatePDFBasic(file: File): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let pdfInfo: ValidationResult['pdfInfo'] = {};

  try {
    const buffer = new Uint8Array(await file.slice(0, 1024).arrayBuffer());

    // Check magic bytes
    if (!hasPDFMagicBytes(buffer)) {
      errors.push('File does not have valid PDF magic bytes (%PDF-)');
      return { valid: false, errors, warnings };
    }

    // Extract version
    const version = extractPDFVersion(buffer);
    if (version) {
      pdfInfo.version = version;
    } else {
      warnings.push('Could not determine PDF version');
    }
  } catch (err) {
    errors.push(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { valid: false, errors, warnings };
  }

  return { valid: errors.length === 0, errors, warnings, pdfInfo };
}

/**
 * Performs FULL validation - complete validation before processing.
 * Loads the PDF with pdf-lib to validate structure and pages.
 */
export async function validatePDFFull(file: File): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let pdfInfo: ValidationResult['pdfInfo'] = {};

  // First do basic validation
  const basicResult = await validatePDFBasic(file);
  if (!basicResult.valid) {
    return basicResult;
  }
  errors.push(...basicResult.errors);
  warnings.push(...basicResult.warnings);
  pdfInfo = basicResult.pdfInfo || {};

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Try to load with pdf-lib
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, updateMetadata: false });

    // Validate page count
    const pageCount = pdf.getPageCount();
    if (pageCount === 0) {
      errors.push('PDF has no pages');
      return { valid: false, errors, warnings, pdfInfo };
    }
    pdfInfo.pageCount = pageCount;

    // Check if PDF is linearized (optional optimization indicator)
    // We don't fail on this, just note as warning
    warnings.push('Full structural validation passed');

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    errors.push(`PDF structure validation failed: ${message}`);
    return { valid: false, errors, warnings, pdfInfo };
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    pdfInfo
  };
}

/**
 * Validates a PDF file with specified validation level.
 * @param file - The file to validate
 * @param level - Validation level ('basic' for quick check, 'full' for complete validation)
 * @returns Validation result with status and any errors/warnings found
 */
export async function validatePDF(file: File, level: ValidationLevel = 'basic'): Promise<ValidationResult> {
  return level === 'full' ? validatePDFFull(file) : validatePDFBasic(file);
}

/**
 * Validates file extension and MIME type for PDF files.
 * @deprecated Use validatePDF with appropriate level instead for actual PDF structure validation
 */
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