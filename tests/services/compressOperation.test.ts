import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressPdf } from '../../src/services/pdf/compressOperation';
import { createMockFile, createValidPDFContent } from '../utils/testHelpers';
import { PDFDocument } from 'pdf-lib';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(1),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    })
  }
}));

// Valid PDF content with magic bytes
const VALID_PDF_CONTENT = createValidPDFContent();

function createValidPDFFile(name: string): File {
  return createMockFile(VALID_PDF_CONTENT, name, { type: 'application/pdf' });
}

describe('compressOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(compressPdf(txtFile, 'medium')).rejects.toThrow('not a valid PDF');
  });

  it('compressPdf returns blob', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const result = await compressPdf(pdfFile, 'medium');
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const onProgress = vi.fn();
    await compressPdf(pdfFile, 'medium', onProgress);
    expect(onProgress).toHaveBeenCalled();
  });

  it('works with different quality settings', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const resultLow = await compressPdf(pdfFile, 'low');
    const resultHigh = await compressPdf(pdfFile, 'high');
    expect(resultLow).toBeInstanceOf(Blob);
    expect(resultHigh).toBeInstanceOf(Blob);
  });

  it('handles PDFDict2 error from PDFDocument.load with fallback', async () => {
    let callCount = 0;
    (PDFDocument.load as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          getPageCount: vi.fn().mockReturnValue(1),
          save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
        });
      }
      return Promise.reject(new Error('Expected instance of PDFDict2, but got instance of undefined'));
    });

    const pdfFile = createValidPDFFile('dict2-error.pdf');
    const result = compressPdf(pdfFile, 'medium');
    await expect(result).rejects.toThrow('non-standard structure');
  });

  it('handles encryption error from PDFDocument.load with fallback', async () => {
    let callCount = 0;
    (PDFDocument.load as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          getPageCount: vi.fn().mockReturnValue(1),
          save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
        });
      }
      return Promise.reject(new Error('Input document to PDFDocument.load is encrypted'));
    });

    const pdfFile = createValidPDFFile('encrypted.pdf');
    const result = compressPdf(pdfFile, 'medium');
    await expect(result).rejects.toThrow('encrypted');
  });
});