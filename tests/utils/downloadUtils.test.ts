import { describe, it, expect, vi } from 'vitest';
import { downloadBlob } from '../../src/utils/downloadUtils';

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
});