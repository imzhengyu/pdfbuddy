import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rotatePdf } from '../../src/services/pdf/rotateOperation';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      copyPages: vi.fn().mockResolvedValue([{
        getRotation: () => ({ angle: 0 }),
        setRotation: vi.fn()
      }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(1),
      getPages: vi.fn().mockReturnValue([{
        getRotation: () => ({ angle: 0 }),
        setRotation: vi.fn()
      }]),
      embedPage: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
      copyPages: vi.fn().mockResolvedValue([{
        getRotation: () => ({ angle: 0 }),
        setRotation: vi.fn()
      }]),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    })
  },
  degrees: vi.fn((angle) => ({ angle }))
}));

// Minimal valid PDF content with magic bytes
const VALID_PDF_CONTENT = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
  0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // %EOF
]);

function createMockFile(content: string | Uint8Array, name: string, type: string): File {
  const buffer = typeof content === 'string'
    ? new TextEncoder().encode(content).buffer
    : content.buffer;
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(buffer)
  });
  Object.defineProperty(file, 'slice', {
    writable: true,
    value: vi.fn().mockReturnValue({
      arrayBuffer: vi.fn().mockResolvedValue(buffer)
    })
  });
  return file;
}

function createValidPDFFile(name: string): File {
  return createMockFile(VALID_PDF_CONTENT, name, 'application/pdf');
}

describe('rotateOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws error for non-PDF file', async () => {
    const txtFile = createMockFile('', 'test.txt', 'text/plain');
    await expect(rotatePdf(txtFile, [{ pageIndex: 0, type: 'rotate', degrees: 90 }])).rejects.toThrow('not a valid PDF');
  });

  it('throws error for invalid page index', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    await expect(rotatePdf(pdfFile, [{ pageIndex: 10, type: 'rotate', degrees: 90 }])).rejects.toThrow('Invalid page index');
  });

  it('rotatePdf returns blob', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const result = await rotatePdf(pdfFile, [{ pageIndex: 0, type: 'rotate', degrees: 90 }]);
    expect(result).toBeInstanceOf(Blob);
  });

  it('calls onProgress callback', async () => {
    const pdfFile = createValidPDFFile('test.pdf');
    const onProgress = vi.fn();
    await rotatePdf(pdfFile, [{ pageIndex: 0, type: 'rotate', degrees: 90 }], onProgress);
    expect(onProgress).toHaveBeenCalled();
  });
});