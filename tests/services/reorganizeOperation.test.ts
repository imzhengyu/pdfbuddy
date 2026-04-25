import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reorganizePdf } from '../../src/services/pdf/reorganizeOperation';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(5),
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }]),
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
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const order = [{ originalIndex: 10, newIndex: 0 }];
    await expect(reorganizePdf(pdfFile, order)).rejects.toThrow('Invalid page index');
  });

  it('reorganizePdf returns blob', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
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
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
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
});