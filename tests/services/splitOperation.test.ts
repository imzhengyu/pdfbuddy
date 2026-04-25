import { describe, it, expect, vi, beforeEach } from 'vitest';
import { splitPdf } from '../../src/services/pdf/splitOperation';

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

function createMockFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer)
  });
  return file;
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
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    await expect(splitPdf(pdfFile, [{ start: 10, end: 15 }])).rejects.toThrow('Invalid page number');
  });

  it('splitPdf returns array of blobs', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const result = await splitPdf(pdfFile, [{ start: 1, end: 3 }]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toBeInstanceOf(Blob);
  });

  it('splitPdf with multiple ranges', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const result = await splitPdf(pdfFile, [
      { start: 1, end: 2 },
      { start: 3, end: 4 }
    ]);
    expect(result.length).toBe(2);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const onProgress = vi.fn();
    await splitPdf(pdfFile, [{ start: 1, end: 3 }], onProgress);
    expect(onProgress).toHaveBeenCalled();
  });
});