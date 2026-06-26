import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitPdf } from '../../src/services/pdf/splitOperation';
import { createMockFile, createMockPDFFile, createValidPDFContent } from '../utils/testHelpers';
import { PDFDocument } from 'pdf-lib';

// Mock pdf-lib module - must use inline factory to avoid hoisting issues
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(5),
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }])
    })
  }
}));

// Valid PDF content with magic bytes
const VALID_PDF_CONTENT = createValidPDFContent();

function createValidPDFFile(name: string): File {
  return createMockPDFFile(VALID_PDF_CONTENT, name);
}

describe('splitOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(splitPdf(txtFile, [{ start: 1, end: 3 }])).rejects.toThrow('not a valid PDF');
  });

  it('throws error for invalid page range', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    await expect(splitPdf(pdfFile, [{ start: 10, end: 15 }])).rejects.toThrow('Invalid page number');
  });

  it('splitPdf returns array of blobs', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const result = await splitPdf(pdfFile, [{ start: 1, end: 3 }]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(Blob);
  });

  it('splitPdf with multiple ranges', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const result = await splitPdf(pdfFile, [
      { start: 1, end: 2 },
      { start: 3, end: 4 }
    ]);
    expect(result.length).toBe(2);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const onProgress = vi.fn();
    await splitPdf(pdfFile, [{ start: 1, end: 3 }], onProgress);
    expect(onProgress).toHaveBeenCalled();
  });

  it('handles PDFDict2 error from PDFDocument.load with fallback', async () => {
    let callCount = 0;
    (PDFDocument.load as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          getPageCount: vi.fn().mockReturnValue(5),
          copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }])
        });
      }
      return Promise.reject(new Error('Expected instance of PDFDict2, but got instance of undefined'));
    });

    const pdfFile = createValidPDFFile('dict2-error.pdf');
    const result = splitPdf(pdfFile, [{ start: 1, end: 3 }]);
    await expect(result).rejects.toThrow('non-standard structure');
  });

  it('handles encryption error from PDFDocument.load with fallback', async () => {
    let callCount = 0;
    (PDFDocument.load as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          getPageCount: vi.fn().mockReturnValue(5),
          copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }])
        });
      }
      return Promise.reject(new Error('Input document to PDFDocument.load is encrypted'));
    });

    const pdfFile = createValidPDFFile('encrypted.pdf');
    const result = splitPdf(pdfFile, [{ start: 1, end: 3 }]);
    await expect(result).rejects.toThrow('encrypted');
  });
});