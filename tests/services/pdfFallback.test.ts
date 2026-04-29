import { describe, it, expect } from 'vitest';
import {
  isPDFLibError,
  isPDFDict2Error,
  isEncryptionError,
  withPDFLibFallback,
  PDFLibError
} from '../../src/services/pdf/pdfFallback';

describe('pdfFallback', () => {
  describe('isPDFLibError', () => {
    it('returns true for PDFLibError', () => {
      const error = new PDFLibError('test', 'UNKNOWN');
      expect(isPDFLibError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('test');
      expect(isPDFLibError(error)).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isPDFLibError('string')).toBe(false);
      expect(isPDFLibError(null)).toBe(false);
      expect(isPDFLibError(undefined)).toBe(false);
      expect(isPDFLibError({})).toBe(false);
    });
  });

  describe('isPDFDict2Error', () => {
    it('returns true for PDFDict2 in message', () => {
      const error = new Error('PDFDict2 parsing failed');
      expect(isPDFDict2Error(error)).toBe(true);
    });

    it('returns true for Expected instance of PDFDict2', () => {
      const error = new Error('Expected instance of PDFDict2');
      expect(isPDFDict2Error(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Some other error');
      expect(isPDFDict2Error(error)).toBe(false);
    });

    it('returns false for non-Error values', () => {
      expect(isPDFDict2Error('string')).toBe(false);
      expect(isPDFDict2Error(null)).toBe(false);
      expect(isPDFDict2Error(undefined)).toBe(false);
    });
  });

  describe('isEncryptionError', () => {
    it('returns true for encrypted in message', () => {
      const error = new Error('PDF is encrypted');
      expect(isEncryptionError(error)).toBe(true);
    });

    it('returns true for Encryption in message', () => {
      const error = new Error('PDF uses Encryption');
      expect(isEncryptionError(error)).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      const error = new Error('Some other error');
      expect(isEncryptionError(error)).toBe(false);
    });

    it('returns false for non-Error values', () => {
      expect(isEncryptionError('string')).toBe(false);
      expect(isEncryptionError(null)).toBe(false);
      expect(isEncryptionError(undefined)).toBe(false);
    });
  });

  describe('withPDFLibFallback', () => {
    it('returns result when pdfLibOperation succeeds', async () => {
      const result = await withPDFLibFallback(async () => 'success');
      expect(result).toBe('success');
    });

    it('returns result when fallbackOperation succeeds after PDFDict2 error', async () => {
      const pdfDict2Error = new Error('PDFDict2 parsing failed');
      const fallback = async () => 'fallback-success';

      const result = await withPDFLibFallback(
        async () => { throw pdfDict2Error; },
        fallback,
        'test operation'
      );

      expect(result).toBe('fallback-success');
    });

    it('throws PDFLibError with PDFDICT2 code when fallback is not provided', async () => {
      const pdfDict2Error = new Error('PDFDict2 parsing failed');

      await expect(
        withPDFLibFallback(async () => { throw pdfDict2Error; }, undefined, 'test operation')
      ).rejects.toThrow(PDFLibError);

      await expect(
        withPDFLibFallback(async () => { throw pdfDict2Error; }, undefined, 'test operation')
      ).rejects.toMatchObject({ code: 'PDFDICT2' });
    });

    it('retries with ignoreEncryption when encryption error occurs', async () => {
      const encryptionError = new Error('PDF is encrypted');
      let callCount = 0;

      const operation = async () => {
        callCount++;
        if (callCount === 1) {
          throw encryptionError;
        }
        return 'retry-success';
      };

      const result = await withPDFLibFallback(operation, undefined, 'test operation');
      expect(result).toBe('retry-success');
      expect(callCount).toBe(2);
    });

    it('throws PDFLibError with UNKNOWN code for unknown errors', async () => {
      const unknownError = new Error('Some unknown error');

      await expect(
        withPDFLibFallback(async () => { throw unknownError; }, undefined, 'test operation')
      ).rejects.toThrow(PDFLibError);

      await expect(
        withPDFLibFallback(async () => { throw unknownError; }, undefined, 'test operation')
      ).rejects.toMatchObject({ code: 'UNKNOWN' });
    });

    it('throws PDFLibError with UNKNOWN for non-Error throws', async () => {
      await expect(
        withPDFLibFallback(async () => { throw 'string error'; }, undefined, 'test operation')
      ).rejects.toMatchObject({ code: 'UNKNOWN' });
    });

    it('preserves original error in PDFLibError', async () => {
      const pdfDict2Error = new Error('PDFDict2 parsing failed');

      await expect(
        withPDFLibFallback(async () => { throw pdfDict2Error; }, undefined, 'test operation')
      ).rejects.toMatchObject({
        code: 'PDFDICT2',
        originalError: pdfDict2Error
      });
    });
  });
});
