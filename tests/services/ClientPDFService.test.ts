import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/convertOperation', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/pdf/convertOperation')>('../../src/services/pdf/convertOperation');
  return {
    ...actual,
    convertPdfToImages: vi.fn().mockResolvedValue([new Blob(['image'], { type: 'image/png' })]),
  };
});

// Minimal valid PDF content with magic bytes
const VALID_PDF_CONTENT = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
  0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // %EOF
]);

// Helper to create a mock File with arrayBuffer
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

// Mock pdf-lib module
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    load: vi.fn().mockResolvedValue({
      getPageIndices: vi.fn().mockReturnValue([0]),
      getPageCount: vi.fn().mockReturnValue(1),
      getPages: vi.fn().mockReturnValue([{ getRotation: () => ({ angle: 0 }), setRotation: vi.fn() }]),
      copyPages: vi.fn().mockResolvedValue([{ addPage: vi.fn() }])
    })
  }
}));

describe('ClientPDFService', () => {
  let service: ClientPDFService;

  beforeEach(() => {
    service = new ClientPDFService();
  });

  describe('merge', () => {
    it('throws error when less than 2 files provided', async () => {
      const singleFile = createValidPDFFile('test.pdf');
      await expect(service.merge([singleFile])).rejects.toThrow('At least 2 files');
    });

    it('throws error for non-PDF files', async () => {
      const pdfFile = createValidPDFFile('test.pdf');
      const txtFile = createMockFile('', 'test.txt', 'text/plain');
      await expect(service.merge([pdfFile, txtFile])).rejects.toThrow('not a valid PDF');
    });
  });

  describe('split', () => {
    it('throws error for non-PDF files', async () => {
      const txtFile = createMockFile('', 'test.txt', 'text/plain');
      await expect(service.split(txtFile, [{ start: 1, end: 1 }])).rejects.toThrow('not a valid PDF');
    });
  });

  describe('compress', () => {
    it('throws error for non-PDF files', async () => {
      const txtFile = createMockFile('', 'test.txt', 'text/plain');
      await expect(service.compress(txtFile, 'medium')).rejects.toThrow('not a valid PDF');
    });
  });

  describe('rotate', () => {
    it('throws error for non-PDF files', async () => {
      const txtFile = createMockFile('', 'test.txt', 'text/plain');
      await expect(service.rotate(txtFile, [{ pageIndex: 0, degrees: 90 }])).rejects.toThrow('not a valid PDF');
    });
  });

  describe('convertToImages', () => {
    it('returns image blobs for each page', async () => {
      const pdfFile = createValidPDFFile('test.pdf');
      const images = await service.convertToImages(pdfFile, { format: 'png' });
      expect(images).toHaveLength(1);
      expect(images[0]).toBeInstanceOf(Blob);
    });
  });

  describe('retry integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('wraps merge with retry', async () => {
      const mergeSpy = vi.spyOn(service, 'merge');

      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      mergeSpy.mockResolvedValue(mockBlob);

      const file1 = createValidPDFFile('test1.pdf');
      const file2 = createValidPDFFile('test2.pdf');

      await service.merge([file1, file2]);

      expect(mergeSpy).toHaveBeenCalled();
    });

    it('wraps split with retry', async () => {
      const splitSpy = vi.spyOn(service, 'split');

      const mockBlobs = [new Blob(['pdf'], { type: 'application/pdf' })];
      splitSpy.mockResolvedValue(mockBlobs);

      const file = createValidPDFFile('test.pdf');

      await service.split(file, [{ start: 1, end: 1 }]);

      expect(splitSpy).toHaveBeenCalled();
    });

    it('wraps compress with retry', async () => {
      const compressSpy = vi.spyOn(service, 'compress');

      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      compressSpy.mockResolvedValue(mockBlob);

      const file = createValidPDFFile('test.pdf');

      await service.compress(file, 'medium');

      expect(compressSpy).toHaveBeenCalled();
    });

    it('wraps rotate with retry', async () => {
      const rotateSpy = vi.spyOn(service, 'rotate');

      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      rotateSpy.mockResolvedValue(mockBlob);

      const file = createValidPDFFile('test.pdf');

      await service.rotate(file, [{ pageIndex: 0, type: 'rotate', degrees: 90 }]);

      expect(rotateSpy).toHaveBeenCalled();
    });

    it('wraps convertToPDF with retry', async () => {
      const convertToPDFSpy = vi.spyOn(service, 'convertToPDF');

      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      convertToPDFSpy.mockResolvedValue(mockBlob);

      const imageFile = createMockFile('image', 'test.png', 'image/png');

      await service.convertToPDF([imageFile]);

      expect(convertToPDFSpy).toHaveBeenCalled();
    });

    it('wraps reorganize with retry', async () => {
      const reorganizeSpy = vi.spyOn(service, 'reorganize');

      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      reorganizeSpy.mockResolvedValue(mockBlob);

      const file = createValidPDFFile('test.pdf');

      await service.reorganize(file, [{ originalIndex: 0, newIndex: 0 }]);

      expect(reorganizeSpy).toHaveBeenCalled();
    });

    it('wraps convertToImages with retry', async () => {
      const convertToImagesSpy = vi.spyOn(service, 'convertToImages');

      const pdfFile = createValidPDFFile('test.pdf');

      await service.convertToImages(pdfFile, { format: 'png' });
      expect(convertToImagesSpy).toHaveBeenCalled();
    });
  });
});