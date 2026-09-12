import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadBlob, downloadBlobsAsZip } from '../../src/utils/downloadUtils';
import { CONST_DOWNLOAD_CONFIG } from '../../src/config';

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

// Regression coverage for exported ZIP archives and page images, which used to
// be renamed to `.pdf` because the downloader only allowed the PDF extension.
describe('downloadBlob extension handling for exports', () => {
  let downloads: string[];

  beforeEach(() => {
    downloads = [];
    // Earlier tests in this file mock document.createElement and document.body;
    // restore them so a real anchor is created and the prototype click can be
    // observed. The earlier suite also replaces the jszip module, so undo that
    // to exercise the real archive generation here.
    vi.restoreAllMocks();
    vi.doUnmock('jszip');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    });
  });

  function lastFilename(): string {
    expect(downloads.length).toBeGreaterThan(0);
    return downloads[downloads.length - 1];
  }

  it('keeps the .zip extension for ZIP archives', () => {
    downloadBlob(new Blob(['zip'], { type: 'application/zip' }), 'split-source_selected.zip');

    expect(lastFilename()).toBe('split-source_selected.zip');
  });

  it('keeps the .png extension for PNG blobs', () => {
    downloadBlob(new Blob(['png'], { type: 'image/png' }), 'split-source_page_1.png');

    expect(lastFilename()).toBe('split-source_page_1.png');
  });

  it('keeps the .jpg extension for JPEG blobs', () => {
    downloadBlob(new Blob(['jpg'], { type: 'image/jpeg' }), 'page_1.jpg');

    expect(lastFilename()).toBe('page_1.jpg');
  });

  it('falls back to .pdf when the MIME type and the extension are both unknown', () => {
    downloadBlob(new Blob(['bin'], { type: 'application/octet-stream' }), 'mystery.bin');

    expect(lastFilename()).toBe('mystery.pdf');
  });

  it('names a ZIP of split pages with a .zip extension', async () => {
    await downloadBlobsAsZip(
      [{ name: 'page_1.pdf', blob: new Blob(['pdf'], { type: 'application/pdf' }) }],
      'split-source_selected.zip'
    );

    expect(lastFilename()).toBe('split-source_selected.zip');
  });

  it('revokes the blob URL only after a delay, so the download is not cancelled', () => {
    // restoreAllMocks() above clears the stubbed implementation, so restate it.
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:test-url');
    const timeoutSpy = vi.spyOn(window, 'setTimeout');

    downloadBlob(new Blob(['pdf'], { type: 'application/pdf' }), 'merged.pdf');

    // Revoking in the same tick can abort a download that is still starting.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    const [callback, delay] = timeoutSpy.mock.calls[0];
    expect(delay).toBe(CONST_DOWNLOAD_CONFIG.urlRevokeDelayMs);
    (callback as () => void)();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });
});
