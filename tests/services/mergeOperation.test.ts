import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mergePdfs } from '../../src/services/pdf/mergeOperation';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPageIndices: vi.fn().mockReturnValue([0, 1]),
      getPageCount: vi.fn().mockReturnValue(2),
      getPages: vi.fn().mockReturnValue([]),
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

describe('mergeOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error when less than 2 files provided', async () => {
    const singleFile = createMockFile('', 'test.pdf', 'application/pdf');
    await expect(mergePdfs([singleFile])).rejects.toThrow('At least 2 files');
  });

  it('throws error for non-PDF files', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(mergePdfs([pdfFile, txtFile])).rejects.toThrow('not a valid PDF file');
  });

  it('mergePdfs function is available', async () => {
    const file1 = createMockFile('test1', 'test1.pdf', 'application/pdf');
    const file2 = createMockFile('test2', 'test2.pdf', 'application/pdf');
    const result = await mergePdfs([file1, file2]);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const file1 = createMockFile('test1', 'test1.pdf', 'application/pdf');
    const file2 = createMockFile('test2', 'test2.pdf', 'application/pdf');
    const onProgress = vi.fn();
    await mergePdfs([file1, file2], onProgress);
    expect(onProgress).toHaveBeenCalled();
  });
});