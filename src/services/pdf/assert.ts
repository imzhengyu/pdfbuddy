import { PDFProcessingError } from './types';

type ErrorCode = 'FILE_VALIDATION' | 'FILE_SIZE' | 'PAGE_RANGE' | 'FORMAT' | 'PROCESSING' | 'DOWNLOAD';

export function assert(
  condition: unknown,
  message: string,
  code: ErrorCode = 'PROCESSING'
): asserts condition {
  if (!condition) {
    throw new PDFProcessingError(message, code);
  }
}

export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  code: ErrorCode = 'PROCESSING'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new PDFProcessingError(message, code);
  }
}

export function assertRange(
  value: number,
  min: number,
  max: number,
  message: string,
  code: ErrorCode = 'PAGE_RANGE'
): void {
  if (value < min || value > max) {
    throw new PDFProcessingError(message, code);
  }
}

export function assertNonEmpty<T>(
  array: T[],
  message: string,
  code: ErrorCode = 'PAGE_RANGE'
): asserts array is [T, ...T[]] {
  if (array.length === 0) {
    throw new PDFProcessingError(message, code);
  }
}

export function assertString(
  value: unknown,
  message: string,
  code: ErrorCode = 'FORMAT'
): asserts value is string {
  if (typeof value !== 'string') {
    throw new PDFProcessingError(message, code);
  }
}

export function assertNumber(
  value: unknown,
  message: string,
  code: ErrorCode = 'PROCESSING'
): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new PDFProcessingError(message, code);
  }
}
