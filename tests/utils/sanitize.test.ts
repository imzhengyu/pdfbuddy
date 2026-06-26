import { describe, it, expect } from 'vitest';
import {
  sanitizeFilename,
  sanitizeExtension,
  sanitizePathComponent,
  isValidFilename,
} from '../../src/utils/sanitize';

describe('sanitize', () => {
  describe('sanitizeFilename', () => {
    it('returns document for empty input', () => {
      expect(sanitizeFilename('')).toBe('document');
      expect(sanitizeFilename(null as any)).toBe('document');
      expect(sanitizeFilename(undefined as any)).toBe('document');
    });

    it('replaces path separators with underscores', () => {
      expect(sanitizeFilename('path/to/file.pdf')).toBe('path_to_file.pdf');
      expect(sanitizeFilename('path\\to\\file.pdf')).toBe('path_to_file.pdf');
    });

    it('replaces forbidden characters', () => {
      expect(sanitizeFilename('file:name.pdf')).toBe('file_name.pdf');
      expect(sanitizeFilename('file*name.pdf')).toBe('file_name.pdf');
      expect(sanitizeFilename('file?name.pdf')).toBe('file_name.pdf');
      expect(sanitizeFilename('file<name>.pdf')).toBe('file_name_.pdf');
      expect(sanitizeFilename('file|name.pdf')).toBe('file_name.pdf');
    });

    it('prevents path traversal with dots', () => {
      // Each dot is replaced with underscore, preventing path traversal
      expect(sanitizeFilename('../../../etc/passwd')).toBe('_._._etc_passwd');
      expect(sanitizeFilename('../../config.json')).toBe('_._config.json');
    });

    it('removes leading/trailing dots and spaces', () => {
      expect(sanitizeFilename('  file.pdf  ')).toBe('file.pdf');
      expect(sanitizeFilename('.file.pdf.')).toBe('file.pdf');
    });

    it('limits filename to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('preserves valid filenames', () => {
      expect(sanitizeFilename('my-document.pdf')).toBe('my-document.pdf');
      expect(sanitizeFilename('report_final_v2.pdf')).toBe('report_final_v2.pdf');
    });

    it('handles filename with only dots', () => {
      expect(sanitizeFilename('...')).toBe('document');
    });
  });

  describe('sanitizeExtension', () => {
    it('returns extension with dot prefix', () => {
      expect(sanitizeExtension('file.pdf', ['.pdf'])).toBe('.pdf');
    });

    it('handles case insensitivity', () => {
      expect(sanitizeExtension('file.PDF', ['.pdf'])).toBe('.pdf');
      expect(sanitizeExtension('file.Pdf', ['.pdf'])).toBe('.pdf');
    });

    it('returns first allowed extension as fallback', () => {
      expect(sanitizeExtension('file.txt', ['.pdf'])).toBe('.pdf');
    });

    it('returns normalized extension', () => {
      expect(sanitizeExtension('file.pdf', ['.PDF'])).toBe('.pdf');
    });

    it('works without dot prefix in allowed list', () => {
      expect(sanitizeExtension('file.pdf', ['pdf'])).toBe('.pdf');
    });

    it('returns first allowed when no extension', () => {
      expect(sanitizeExtension('file', ['.pdf'])).toBe('.pdf');
    });
  });

  describe('sanitizePathComponent', () => {
    it('removes path separators', () => {
      expect(sanitizePathComponent('path/to')).toBe('path_to');
      expect(sanitizePathComponent('path\\to')).toBe('path_to');
    });

    it('returns empty string for invalid input', () => {
      expect(sanitizePathComponent('')).toBe('');
      expect(sanitizePathComponent(null as any)).toBe('');
      expect(sanitizePathComponent(undefined as any)).toBe('');
    });

    it('limits to 255 characters', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizePathComponent(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('isValidFilename', () => {
    it('returns true for valid filenames', () => {
      expect(isValidFilename('document.pdf')).toBe(true);
      expect(isValidFilename('my-file-123.pdf')).toBe(true);
    });

    it('returns false for empty input', () => {
      expect(isValidFilename('')).toBe(false);
      expect(isValidFilename('   ')).toBe(false);
    });

    it('returns false for path traversal', () => {
      expect(isValidFilename('../etc/passwd')).toBe(false);
      expect(isValidFilename('..\\config.json')).toBe(false);
    });

    it('returns false for null bytes', () => {
      expect(isValidFilename('file\0.pdf')).toBe(false);
    });

    it('returns false for filenames over 255 chars', () => {
      expect(isValidFilename('a'.repeat(256) + '.pdf')).toBe(false);
    });

    it('returns false for double dots (path traversal)', () => {
      expect(isValidFilename('..')).toBe(false);
      expect(isValidFilename('../etc')).toBe(false);
    });

    it('returns true for single dot (valid filename)', () => {
      expect(isValidFilename('.')).toBe(true);
    });
  });
});