import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

// Helper to create a mock File with arrayBuffer
function createMockFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'arrayBuffer', {
    writable: true,
    value: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer)
  });
  return file;
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
      const singleFile = createMockFile('', 'test.pdf', 'application/pdf');
      await expect(service.merge([singleFile])).rejects.toThrow('At least 2 files');
    });

    it('throws error for non-PDF files', async () => {
      const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
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
    it('throws error indicating backend is needed', async () => {
      const pdfFile = createMockFile('', 'test.pdf', 'application/pdf');
      await expect(service.convertToImages(pdfFile, { format: 'png' })).rejects.toThrow('backend service');
    });
  });
});