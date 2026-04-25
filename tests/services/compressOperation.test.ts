import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressPdf } from '../../src/services/pdf/compressOperation';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
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

describe('compressOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(compressPdf(txtFile, 'medium')).rejects.toThrow('not a valid PDF');
  });

  it('compressPdf returns blob', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const result = await compressPdf(pdfFile, 'medium');
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const onProgress = vi.fn();
    await compressPdf(pdfFile, 'medium', onProgress);
    expect(onProgress).toHaveBeenCalled();
  });

  it('works with different quality settings', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const resultLow = await compressPdf(pdfFile, 'low');
    const resultHigh = await compressPdf(pdfFile, 'high');
    expect(resultLow).toBeInstanceOf(Blob);
    expect(resultHigh).toBeInstanceOf(Blob);
  });
});