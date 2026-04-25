import { PDFProcessingError } from '../services/pdf/types';

export function getErrorMessage(error: unknown): string {
  if (error instanceof PDFProcessingError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getRecoverySuggestion(error: unknown): string | undefined {
  if (error instanceof PDFProcessingError && error.recovery) {
    return error.recovery;
  }

  return undefined;
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof PDFProcessingError) {
    return error.code === 'PROCESSING';
  }
  return false;
}