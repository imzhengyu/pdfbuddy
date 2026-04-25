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
  });
});