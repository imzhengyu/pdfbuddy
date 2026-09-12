import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';
import * as mergeOperation from '../../src/services/pdf/mergeOperation';
import * as splitOperation from '../../src/services/pdf/splitOperation';
import * as rotateOperation from '../../src/services/pdf/rotateOperation';
import * as convertOperation from '../../src/services/pdf/convertOperation';
import * as reorganizeOperation from '../../src/services/pdf/reorganizeOperation';

vi.mock('../../src/config/constants', async () => {
  const actual = await vi.importActual<typeof import('../../src/config/constants')>('../../src/config/constants');
  return {
    ...actual,
    CONST_OPERATION_CONFIG: {
      ...actual.CONST_OPERATION_CONFIG,
      retryDelay: 0,
      retryBackoff: 1,
    },
  };
});

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

import { PDFDocument } from 'pdf-lib';

// Mock pdf-lib module
vi.mock('pdf-lib', async () => {
  const { createMockPDFLib } = await import('../mocks/pdfLib');
  return createMockPDFLib({ pageCount: 1 });
});

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

    it('retries merge when underlying operation fails transiently', async () => {
      const mergeSpy = vi.spyOn(mergeOperation, 'mergePdfs')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce(new Blob(['merged'], { type: 'application/pdf' }));

      const file1 = createValidPDFFile('test1.pdf');
      const file2 = createValidPDFFile('test2.pdf');

      const result = await service.merge([file1, file2]);

      expect(result).toBeInstanceOf(Blob);
      expect(mergeSpy).toHaveBeenCalledTimes(3);
    });

    it('retries split when underlying operation fails transiently', async () => {
      const splitSpy = vi.spyOn(splitOperation, 'splitPdf')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce([new Blob(['split'], { type: 'application/pdf' })]);

      const file = createValidPDFFile('test.pdf');

      const result = await service.split(file, [{ start: 1, end: 1 }]);

      expect(result).toHaveLength(1);
      expect(splitSpy).toHaveBeenCalledTimes(2);
    });

    it('retries rotate when underlying operation fails transiently', async () => {
      const rotateSpy = vi.spyOn(rotateOperation, 'rotatePdf')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce(new Blob(['rotated'], { type: 'application/pdf' }));

      const file = createValidPDFFile('test.pdf');

      const result = await service.rotate(file, [{ pageIndex: 0, degrees: 90 }]);

      expect(result).toBeInstanceOf(Blob);
      expect(rotateSpy).toHaveBeenCalledTimes(2);
    });

    it('retries convertToPDF when underlying operation fails transiently', async () => {
      const convertSpy = vi.spyOn(convertOperation, 'convertImagesToPdf')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce(new Blob(['converted'], { type: 'application/pdf' }));

      const imageFile = createMockFile('image', 'test.png', { type: 'image/png' });

      const result = await service.convertToPDF([imageFile]);

      expect(result).toBeInstanceOf(Blob);
      expect(convertSpy).toHaveBeenCalledTimes(2);
    });

    it('retries reorganize when underlying operation fails transiently', async () => {
      const reorganizeSpy = vi.spyOn(reorganizeOperation, 'reorganizePdf')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce(new Blob(['reorganized'], { type: 'application/pdf' }));

      const file = createValidPDFFile('test.pdf');

      const result = await service.reorganize(file, [{ originalIndex: 0, newIndex: 0 }]);

      expect(result).toBeInstanceOf(Blob);
      expect(reorganizeSpy).toHaveBeenCalledTimes(2);
    });

    it('retries convertToImages when underlying operation fails transiently', async () => {
      const convertImagesSpy = vi.spyOn(convertOperation, 'convertPdfToImages')
        .mockRejectedValueOnce(new Error('transient failure'))
        .mockResolvedValueOnce([new Blob(['image'], { type: 'image/png' })]);

      const pdfFile = createValidPDFFile('test.pdf');

      const result = await service.convertToImages(pdfFile, { format: 'png' });

      expect(result).toHaveLength(1);
      expect(convertImagesSpy).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all retry attempts', async () => {
      vi.spyOn(mergeOperation, 'mergePdfs')
        .mockRejectedValue(new Error('persistent failure'));

      const file1 = createValidPDFFile('test1.pdf');
      const file2 = createValidPDFFile('test2.pdf');

      await expect(service.merge([file1, file2])).rejects.toThrow('persistent failure');
    });
  });
});