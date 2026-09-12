import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reorganizePdf } from '../../src/services/pdf/reorganizeOperation';
import { createMockFile, createValidPDFContent } from '../utils/testHelpers';
import { PDFDocument } from 'pdf-lib';

vi.mock('pdf-lib', async () => {
  const { createMockPDFLib } = await import('../mocks/pdfLib');
  return createMockPDFLib({ pageCount: 5 });
});

// Valid PDF content with magic bytes
const VALID_PDF_CONTENT = createValidPDFContent();

function createValidPDFFile(name: string): File {
  return createMockFile(VALID_PDF_CONTENT, name, { type: 'application/pdf' });
}

describe('reorganizeOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    const order = [{ originalIndex: 0, newIndex: 0 }];
    await expect(reorganizePdf(txtFile, order)).rejects.toThrow('not a valid PDF');
  });

  it('throws error for invalid page index', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const order = [{ originalIndex: 10, newIndex: 0 }];
    await expect(reorganizePdf(pdfFile, order)).rejects.toThrow('Invalid page index');
  });

  it('reorganizePdf returns blob', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const order = [
      { originalIndex: 0, newIndex: 4 },
      { originalIndex: 1, newIndex: 0 },
      { originalIndex: 2, newIndex: 2 },
      { originalIndex: 3, newIndex: 3 },
      { originalIndex: 4, newIndex: 1 }
    ];
    const result = await reorganizePdf(pdfFile, order);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const order = [
      { originalIndex: 0, newIndex: 0 },
      { originalIndex: 1, newIndex: 1 },
      { originalIndex: 2, newIndex: 2 },
      { originalIndex: 3, newIndex: 3 },
      { originalIndex: 4, newIndex: 4 }
    ];
    const onProgress = vi.fn();
    await reorganizePdf(pdfFile, order, onProgress);
    expect(onProgress).toHaveBeenCalled();
  });

  it('rejects a PDF whose structure cannot be parsed, naming the file', async () => {
    (PDFDocument.load as any).mockImplementationOnce(() =>
      Promise.reject(new Error('Expected instance of PDFDict2, but got instance of undefined'))
    );

    const pdfFile = createValidPDFFile('broken.pdf');
    const order = [{ originalIndex: 0, newIndex: 0 }];
    const result = reorganizePdf(pdfFile, order);

    await expect(result).rejects.toThrow('PDF structure validation failed');
    await expect(result).rejects.toThrow('broken.pdf');
  });
});
