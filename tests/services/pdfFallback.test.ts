import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFLibError, isPDFLibError, isPDFDict2Error, isEncryptionError, withPDFLibFallback } from '../../src/services/pdf/pdfFallback';

describe('pdfFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPDFLibError', () => {
    it('returns true for PDFLibError instances', () => {
      const error = new PDFLibError('test', 'UNKNOWN');
      expect(isPDFLibError(error)).toBe(true);
    });

    it('returns false for regular Error', () => {
      const error = new Error('test');
      expect(isPDFLibError(error)).toBe(false);
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

    it('throws PDFLibError with ENCRYPTED code when encryption error occurs', async () => {
      const encryptionError = new Error('PDF is encrypted');

      await expect(
        withPDFLibFallback(async () => { throw encryptionError; }, undefined, 'test operation')
      ).rejects.toThrow(PDFLibError);

      await expect(
        withPDFLibFallback(async () => { throw encryptionError; }, undefined, 'test operation')
      ).rejects.toMatchObject({ code: 'ENCRYPTED' });
    });

    it('throws PDFLibError with UNKNOWN code for unknown errors', async () => {
      const unknownError = new Error('Some unknown error');

      await expect(
        withPDFLibFallback(async () => { throw unknownError; }, undefined, 'test operation')
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
