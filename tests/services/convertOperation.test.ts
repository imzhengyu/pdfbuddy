import { describe, it, expect, vi } from 'vitest';
import { convertImagesToPdf, pdfToImagesNotSupported, convertPdfToImages } from '../../src/services/pdf/convertOperation';
import { PDFProcessingError } from '../../src/services/pdf/types';


vi.mock('pdf-lib', async () => {
  const { createMockPDFLib } = await import('../mocks/pdfLib');
  return createMockPDFLib({ pageCount: 2 });
});

// Mock pdfjs-dist module
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
        render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
      })
    })
  })
}));

function createMockImageFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer)
  });
  return file;
}

function createMockPDFFile(name: string): File {
  const file = new File(['pdf'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(new ArrayBuffer(8))
  });
  return file;
}

describe('convertOperation', () => {
  describe('convertImagesToPdf', () => {
    it('throws error for non-image file', async () => {
      const pdfFile = createMockImageFile('test', 'test.pdf', 'application/pdf');
      await expect(convertImagesToPdf([pdfFile])).rejects.toThrow('not an image file');
    });

    it('throws error for unsupported image format', async () => {
      const gifFile = createMockImageFile('test', 'test.gif', 'image/gif');
      await expect(convertImagesToPdf([gifFile])).rejects.toThrow('Unsupported image format');
    });

    it('convertImagesToPdf returns blob', async () => {
      const pngFile = createMockImageFile('test', 'test.png', 'image/png');
      const result = await convertImagesToPdf([pngFile]);
      expect(result).toBeInstanceOf(Blob);
    });

    it('convertImagesToPdf calls onProgress callback', async () => {
      const pngFile = createMockImageFile('test', 'test.png', 'image/png');
      const onProgress = vi.fn();
      await convertImagesToPdf([pngFile], onProgress);
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('convertPdfToImages', () => {
    it('converts PDF pages to images using browser path', async () => {
      const mockBlob = new Blob(['fake-image'], { type: 'image/png' });

      // Mock canvas.toBlob
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback | null) => {
        if (callback) {
          callback(mockBlob);
        }
      }) as any;

      const pdfFile = createMockPDFFile('test.pdf');

      const result = await convertPdfToImages(pdfFile);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(mockBlob);
    });

    it('renders only the requested pages, in ascending order', async () => {
      const mockBlob = new Blob(['fake-image'], { type: 'image/png' });
      HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback | null) => {
        if (callback) callback(mockBlob);
      }) as any;

      const pdfjs = await import('pdfjs-dist');
      const doc = await (pdfjs.getDocument as any)().promise;
      const getPageMock = doc.getPage as ReturnType<typeof vi.fn>;
      getPageMock.mockClear();

      const pdfFile = createMockPDFFile('test.pdf');

      // Page 2 requested twice plus an out-of-range page: request is clamped,
      // de-duplicated and sorted, and only those pages get rasterised.
      const result = await convertPdfToImages(pdfFile, undefined, { pages: [2, 2, 99] });

      expect(getPageMock).toHaveBeenCalledTimes(1);
      expect(getPageMock).toHaveBeenCalledWith(2);
      expect(result.length).toBe(1);
    });
  });

  describe('pdfToImagesNotSupported', () => {
    it('throws error indicating backend is needed', () => {
      expect(() => pdfToImagesNotSupported()).toThrow(PDFProcessingError);
      expect(() => pdfToImagesNotSupported()).toThrow('backend service');
    });
  });
});
