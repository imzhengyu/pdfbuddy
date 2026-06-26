import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadBlob, downloadBlobsAsZip } from '../../src/utils/downloadUtils';

describe('downloadUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
      revokeObjectURL: vi.fn()
    });
  });

  describe('downloadBlob', () => {
    it('creates a download link and clicks it', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';

      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: mockRemove
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      downloadBlob(blob, filename);

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockBody.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('sanitizes filenames with path traversal attempts', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      // Filename with '..' is detected as invalid by isValidFilename and replaced with default
      const maliciousFilename = '../../../etc/passwd';

      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: mockRemove
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      downloadBlob(blob, maliciousFilename);

      // isValidFilename returns false for filenames containing '..', so sanitized default is used
      expect(mockLink.download).toBe('document.pdf');
    });

    it('sanitizes filenames with special characters', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'my file:with*special|chars.pdf';

      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: mockRemove
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      downloadBlob(blob, filename);

      expect(mockLink.download).toBe('my file_with_special_chars.pdf');
    });

    it('sanitizes filenames with special characters', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      // Normal filename with special characters should be sanitized
      const filename = 'my file:name.pdf';

      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: mockRemove
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      downloadBlob(blob, filename);

      // Special characters are replaced with underscores
      expect(mockLink.download).toBe('my file_name.pdf');
    });

    it('rejects invalid filenames when rejectInvalid option is true', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const invalidFilename = '';

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      expect(() => downloadBlob(blob, invalidFilename, { rejectInvalid: true })).toThrow('Invalid filename');
    });

    it('sanitizes non-pdf extensions to .pdf', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'document.exe';

      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: mockRemove
      };
      Object.defineProperty(document, 'body', {
        get: () => mockBody,
        configurable: true
      });

      downloadBlob(blob, filename);

      // Should force .pdf extension
      expect(mockLink.download).toBe('document.pdf');
    });
  });

  describe('downloadBlobsAsZip', () => {
    it('downloads multiple blobs as a zip file', async () => {
      const mockZip = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip content']))
      };
      vi.doMock('jszip', () => ({ default: vi.fn(() => mockZip) }), { virtual: true });

      const blobs = [
        { name: 'file1.pdf', blob: new Blob(['content1'], { type: 'application/pdf' }) },
        { name: 'file2.pdf', blob: new Blob(['content2'], { type: 'application/pdf' }) }
      ];

      const downloadBlobSpy = vi.spyOn(await import('../../src/utils/downloadUtils'), 'downloadBlob');

      await downloadBlobsAsZip(blobs, 'output.zip');

      expect(mockZip.file).toHaveBeenCalledTimes(2);
      expect(mockZip.generateAsync).toHaveBeenCalled();
    });

    it('sanitizes blob names in zip to prevent path traversal', async () => {
      const mockZip = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip content']))
      };
      vi.doMock('jszip', () => ({ default: vi.fn(() => mockZip) }), { virtual: true });

      const maliciousBlobs = [
        { name: '../../../etc/passwd', blob: new Blob(['content'], { type: 'application/pdf' }) },
        { name: 'normal.pdf', blob: new Blob(['content'], { type: 'application/pdf' }) }
      ];

      await downloadBlobsAsZip(maliciousBlobs, 'output.zip');

      // First entry should be sanitized (path traversal blocked)
      // The sanitized name should not contain path separators or drive letters
      const firstCallArgs = mockZip.file.mock.calls[0];
      expect(firstCallArgs[0]).not.toContain('..');
      expect(firstCallArgs[0]).not.toContain('/');
      expect(firstCallArgs[0]).not.toContain('\\');
      expect(mockZip.file).toHaveBeenCalledWith(expect.any(String), expect.any(Blob));
    });
  });
});