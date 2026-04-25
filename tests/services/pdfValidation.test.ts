import { describe, it, expect } from 'vitest';
import { validatePDFFile, validatePageRange, validatePageIndex, validateImageFile, validateImageFormat } from '../../src/services/pdf/pdfValidation';
import { PDFProcessingError } from '../../src/services/pdf/types';

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
});