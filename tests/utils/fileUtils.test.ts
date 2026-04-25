import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatFileSize, getFileExtension, validatePDFFile, validateImageFile, createObjectURL, revokeObjectURL } from '../../src/utils/fileUtils';

describe('fileUtils', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
      revokeObjectURL: vi.fn()
    });
  });

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

  describe('validateImageFile', () => {
    it('returns true for PNG files', () => {
      const file = new File([], 'test.png', { type: 'image/png' });
      expect(validateImageFile(file)).toBe(true);
    });

    it('returns true for JPEG files', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(file)).toBe(true);
    });

    it('returns false for GIF files', () => {
      const file = new File([], 'test.gif', { type: 'image/gif' });
      expect(validateImageFile(file)).toBe(false);
    });

    it('returns false for files with image type but unsupported format', () => {
      const file = new File([], 'test.bmp', { type: 'image/bmp' });
      expect(validateImageFile(file)).toBe(false);
    });
  });

  describe('createObjectURL', () => {
    it('creates object URL from blob', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = createObjectURL(blob);
      expect(url).toBe('blob:test-url');
    });
  });

  describe('revokeObjectURL', () => {
    it('revokes object URL', () => {
      revokeObjectURL('blob:test-url');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });
});