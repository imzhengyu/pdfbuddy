import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileExtension, validatePDFFile } from '../../src/utils/fileUtils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('handles zero', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
    });

    it('handles filenames with dots', () => {
      expect(getFileExtension('document.backup.pdf')).toBe('pdf');
    });

    it('returns empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
    });
  });

  describe('validatePDFFile', () => {
    it('returns true for PDF files with correct type', () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' });
      expect(validatePDFFile(file)).toBe(true);
    });

    it('returns true for PDF files with pdf extension but different type', () => {
      const file = new File([], 'test.pdf', { type: 'application/octet-stream' });
      expect(validatePDFFile(file)).toBe(true);
    });

    it('returns false for non-PDF files', () => {
      const file = new File([], 'test.txt', { type: 'text/plain' });
      expect(validatePDFFile(file)).toBe(false);
    });
  });
});