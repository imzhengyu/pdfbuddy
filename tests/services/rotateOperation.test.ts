import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rotatePdf } from '../../src/services/pdf/rotateOperation';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPages: vi.fn().mockReturnValue([{
        getRotation: () => ({ angle: 0 }),
        setRotation: vi.fn()
      }]),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    })
  },
  degrees: vi.fn((angle) => ({ angle }))
}));

function createMockFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer)
  });
  return file;
}

describe('rotateOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(rotatePdf(txtFile, [{ pageIndex: 0, degrees: 90 }])).rejects.toThrow('not a valid PDF');
  });

  it('throws error for invalid page index', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    await expect(rotatePdf(pdfFile, [{ pageIndex: 10, degrees: 90 }])).rejects.toThrow('Invalid page index');
  });

  it('rotatePdf returns blob', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const result = await rotatePdf(pdfFile, [{ pageIndex: 0, degrees: 90 }]);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
    const onProgress = vi.fn();
    await rotatePdf(pdfFile, [{ pageIndex: 0, degrees: 90 }], onProgress);
    expect(onProgress).toHaveBeenCalled();
  });
});