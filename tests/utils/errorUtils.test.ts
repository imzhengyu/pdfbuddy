import { describe, it, expect } from 'vitest';
import { getErrorMessage, getRecoverySuggestion, isRetryable } from '../../src/utils/errorUtils';
import { PDFProcessingError } from '../../src/services/pdf/types';

describe('errorUtils', () => {
  describe('getErrorMessage', () => {
    it('returns message from PDFProcessingError', () => {
      const error = new PDFProcessingError('Test error', 'FILE_VALIDATION', 'Try again');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('returns message from Error', () => {
      const error = new Error('Standard error');
      expect(getErrorMessage(error)).toBe('Standard error');
    });

    it('returns default message for unknown object', () => {
      expect(getErrorMessage({ code: 123 })).toBe('An unexpected error occurred');
    });
  });

  describe('getRecoverySuggestion', () => {
    it('returns recovery from PDFProcessingError when present', () => {
      const error = new PDFProcessingError('Error', 'PROCESSING', 'Try smaller file');
      expect(getRecoverySuggestion(error)).toBe('Try smaller file');
    });

    it('returns undefined when PDFProcessingError has no recovery', () => {
      const error = new PDFProcessingError('Error', 'FILE_VALIDATION');
      expect(getRecoverySuggestion(error)).toBeUndefined();
    });

    it('returns undefined for regular Error', () => {
      const error = new Error('Some error');
      expect(getRecoverySuggestion(error)).toBeUndefined();
    });

    it('returns undefined for null', () => {
      expect(getRecoverySuggestion(null)).toBeUndefined();
    });
  });

  describe('isRetryable', () => {
    it('returns true for PROCESSING error code', () => {
      const error = new PDFProcessingError('Timeout', 'PROCESSING', 'Retry later');
      expect(isRetryable(error)).toBe(true);
    });

    it('returns false for FILE_VALIDATION code', () => {
      const error = new PDFProcessingError('Invalid', 'FILE_VALIDATION', 'Check file');
      expect(isRetryable(error)).toBe(false);
    });

    it('returns false for FILE_SIZE code', () => {
      const error = new PDFProcessingError('Too large', 'FILE_SIZE', 'Compress');
      expect(isRetryable(error)).toBe(false);
    });

    it('returns false for regular Error', () => {
      const error = new Error('Some error');
      expect(isRetryable(error)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isRetryable(null)).toBe(false);
    });
  });
});