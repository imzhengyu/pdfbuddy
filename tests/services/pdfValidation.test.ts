import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePDFFile, validatePageRange, validatePageIndex, validateImageFile, validateImageFormat, validatePDF, validatePDFFull } from '../../src/services/pdf/pdfValidation';
import { PDFProcessingError } from '../../src/services/pdf/types';
import { PDFDocument } from 'pdf-lib';
import { createMockFile, createMockPDFFile, createValidPDFContent } from '../utils/testHelpers';

vi.mock('pdf-lib', async () => {
  const { createMockPDFLib } = await import('../mocks/pdfLib');
  return createMockPDFLib({ pageCount: 3 });
});

describe('pdfValidation', () => {
  describe('validatePDFFile', () => {
    it('does not throw for PDF file', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(() => validatePDFFile(file)).not.toThrow();
    });

    it('throws for non-PDF file', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(() => validatePDFFile(file)).toThrow(PDFProcessingError);
      expect(() => validatePDFFile(file)).toThrow('not a valid PDF file');
    });
  });

  describe('validatePageRange', () => {
    it('does not throw for valid range', () => {
      expect(() => validatePageRange({ start: 1, end: 5 }, 10)).not.toThrow();
      expect(() => validatePageRange({ start: 3, end: -1 }, 10)).not.toThrow();
    });

    it('throws for start < 1', () => {
      expect(() => validatePageRange({ start: 0, end: 5 }, 10)).toThrow('Invalid page number');
    });

    it('throws for start > pageCount', () => {
      expect(() => validatePageRange({ start: 11, end: 15 }, 10)).toThrow('Invalid page number');
    });

    it('throws when end > pageCount', () => {
      expect(() => validatePageRange({ start: 1, end: 15 }, 10)).toThrow('Invalid page range');
    });

    it('throws when end < start', () => {
      expect(() => validatePageRange({ start: 5, end: 3 }, 10)).toThrow('Invalid page range');
    });
  });

  describe('validatePageIndex', () => {
    it('does not throw for valid index', () => {
      expect(() => validatePageIndex(0, 10, 'rotate')).not.toThrow();
      expect(() => validatePageIndex(5, 10, 'rotate')).not.toThrow();
      expect(() => validatePageIndex(9, 10, 'rotate')).not.toThrow();
    });

    it('throws for negative index', () => {
      expect(() => validatePageIndex(-1, 10, 'rotate')).toThrow('Invalid page index');
    });

    it('throws for index >= pageCount', () => {
      expect(() => validatePageIndex(10, 10, 'rotate')).toThrow('Invalid page index');
    });
  });

  describe('validateImageFile', () => {
    it('does not throw for image file', () => {
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const jpgFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImageFile(pngFile)).not.toThrow();
      expect(() => validateImageFile(jpgFile)).not.toThrow();
    });

    it('throws for non-image file', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(() => validateImageFile(file)).toThrow('not an image file');
    });
  });

  describe('validateImageFormat', () => {
    it('does not throw for PNG', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(() => validateImageFormat(file)).not.toThrow();
    });

    it('does not throw for JPEG', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(() => validateImageFormat(file)).not.toThrow();
    });

    it('throws for unsupported format', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      expect(() => validateImageFormat(file)).toThrow('Unsupported image format');
    });
  });

  describe('validatePDF cache', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('reuses cached full validation result for the same file', async () => {
      const file = createMockPDFFile(createValidPDFContent(), 'test.pdf');

      const result1 = await validatePDFFull(file);
      const result2 = await validatePDFFull(file);

      expect(PDFDocument.load).toHaveBeenCalledTimes(1);
      expect(result2).toBe(result1);
    });

    it('does not reuse cache when file metadata differs', async () => {
      const now = Date.now();
      const file1 = createMockFile(createValidPDFContent(), 'test.pdf', { type: 'application/pdf', lastModified: now });
      const file2 = createMockFile(createValidPDFContent(), 'test.pdf', { type: 'application/pdf', lastModified: now + 1 });

      await validatePDFFull(file1);
      await validatePDFFull(file2);

      expect(PDFDocument.load).toHaveBeenCalledTimes(2);
    });

    it('returns validation error without calling PDFDocument.load for non-PDF files', async () => {
      const file = new File(['not a pdf'], 'test.txt', { type: 'text/plain' });
      const result = await validatePDFFull(file);

      expect(result.valid).toBe(false);
      expect(PDFDocument.load).not.toHaveBeenCalled();
    });

    it('validatePDF with level full uses cached result', async () => {
      const file = createMockPDFFile(createValidPDFContent(), 'test.pdf');

      await validatePDF(file, 'full');
      await validatePDF(file, 'full');

      expect(PDFDocument.load).toHaveBeenCalledTimes(1);
    });
  });
});