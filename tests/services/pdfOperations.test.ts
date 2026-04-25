import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProgressCallback,
  loadPDF,
  loadPDFFromArrayBuffer,
  savePDF,
  savePDFWithOptions,
  getPDFPageCount,
  getPDFPages,
  copyPages,
  addPage,
  createPDF
} from '../../src/services/pdf/pdfOperations';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(5),
      getPages: vi.fn().mockReturnValue([{}, {}]),
      copyPages: vi.fn().mockReturnValue([{}]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    }),
    create: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(0),
      getPages: vi.fn().mockReturnValue([]),
      copyPages: vi.fn().mockReturnValue([{}]),
      addPage: vi.fn(),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
    })
  }
}));

describe('pdfOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProgressCallback', () => {
    it('creates a callback that updates progress', () => {
      const callback = createProgressCallback(2, 5);
      const progress = { current: 0, total: 0, percent: 0 };
      callback(progress);
      expect(progress.current).toBe(2);
      expect(progress.total).toBe(5);
      expect(progress.percent).toBe(40);
    });

    it('handles zero total', () => {
      const callback = createProgressCallback(0, 0);
      const progress = { current: 0, total: 0, percent: 0 };
      callback(progress);
      expect(progress.current).toBe(0);
      expect(progress.total).toBe(0);
    });
  });

  describe('loadPDF', () => {
    it('loads PDF from file', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'arrayBuffer', {
        writable: true,
        value: vi.fn().mockResolvedValue(new ArrayBuffer(10))
      });
      const result = await loadPDF(file);
      expect(result).toBeDefined();
    });
  });

  describe('loadPDFFromArrayBuffer', () => {
    it('loads PDF from array buffer', async () => {
      const buffer = new ArrayBuffer(10);
      const result = await loadPDFFromArrayBuffer(buffer);
      expect(result).toBeDefined();
    });
  });

  describe('savePDF', () => {
    it('saves PDF and returns blob', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockPdf = await PDFDocument.create();
      const result = await savePDF(mockPdf);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('savePDFWithOptions', () => {
    it('saves PDF with options', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const mockPdf = await PDFDocument.create();
      const result = await savePDFWithOptions(mockPdf, { useObjectStreams: true });
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('getPDFPageCount', () => {
    it('returns page count', () => {
      const { PDFDocument } = require('pdf-lib');
      const mockPdf = { getPageCount: vi.fn().mockReturnValue(10) };
      const count = getPDFPageCount(mockPdf);
      expect(count).toBe(10);
    });
  });

  describe('getPDFPages', () => {
    it('returns pages array', () => {
      const mockPdf = { getPages: vi.fn().mockReturnValue([{}, {}, {}]) };
      const pages = getPDFPages(mockPdf);
      expect(pages).toHaveLength(3);
    });
  });

  describe('copyPages', () => {
    it('copies pages from source to target', async () => {
      const sourcePdf = { copyPages: vi.fn().mockReturnValue([{}]) };
      const targetPdf = { copyPages: vi.fn().mockReturnValue([{}]) };
      const result = await copyPages(sourcePdf as any, targetPdf as any, [0]);
      expect(result).toBeDefined();
    });
  });

  describe('addPage', () => {
    it('adds page to PDF', () => {
      const mockPdf = { addPage: vi.fn() };
      const mockPage = {};
      addPage(mockPdf as any, mockPage as any);
      expect(mockPdf.addPage).toHaveBeenCalledWith(mockPage);
    });
  });

  describe('createPDF', () => {
    it('creates a new PDF document', async () => {
      const result = await createPDF();
      expect(result).toBeDefined();
    });
  });
});