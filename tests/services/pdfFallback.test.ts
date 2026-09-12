import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFLibError, isPDFDict2Error, isEncryptionError, withPDFLibFallback } from '../../src/services/pdf/pdfFallback';

describe('pdfFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    it('returns the result when the operation succeeds', async () => {
      const result = await withPDFLibFallback(async () => 'success');
      expect(result).toBe('success');
    });

    it('classifies a PDFDict2 failure as PDFDICT2', async () => {
      await expect(
        withPDFLibFallback(async () => { throw new Error('PDFDict2 parsing failed'); })
      ).rejects.toMatchObject({ code: 'PDFDICT2' });
    });

    it('classifies an encryption failure as ENCRYPTED', async () => {
      await expect(
        withPDFLibFallback(async () => { throw new Error('PDF is encrypted'); })
      ).rejects.toMatchObject({ code: 'ENCRYPTED' });
    });

    it('classifies an unknown failure as UNKNOWN', async () => {
      await expect(
        withPDFLibFallback(async () => { throw new Error('Some unknown error'); })
      ).rejects.toMatchObject({ code: 'UNKNOWN' });
    });

    it('preserves the original error', async () => {
      const pdfDict2Error = new Error('PDFDict2 parsing failed');
      await expect(
        withPDFLibFallback(async () => { throw pdfDict2Error; })
      ).rejects.toMatchObject({ code: 'PDFDICT2', originalError: pdfDict2Error });
    });

    it('always throws a PDFLibError', async () => {
      await expect(
        withPDFLibFallback(async () => { throw new Error('nope'); })
      ).rejects.toThrow(PDFLibError);
    });
  });
});