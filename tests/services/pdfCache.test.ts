import { describe, it, expect, beforeEach } from 'vitest';
import { pdfCache } from '../../src/services/pdf/pdfCache';

describe('pdfCache', () => {
  const createMockFile = (name: string, size: number, lastModified = 1234567890, content?: string) => {
    const file = { name, size, lastModified } as File;
    // Mock slice so crypto.subtle.digest can read a buffer
    const bufferContent = new TextEncoder().encode(content || `content-${name}-${size}`);
    Object.defineProperty(file, 'slice', {
      writable: true,
      value: vi.fn().mockReturnValue({
        arrayBuffer: vi.fn().mockResolvedValue(bufferContent.buffer),
      }),
    });
    return file;
  };

  beforeEach(() => {
    pdfCache.clear();
  });

  describe('get/set/has', () => {
    it('stores and retrieves PDF entry', async () => {
      const file = createMockFile('test.pdf', 1024);
      const entry = { pdf: { numPages: 5 } };
      await pdfCache.set(file, entry);
      expect(await pdfCache.has(file)).toBe(true);
      expect(await pdfCache.get(file)).toEqual(entry);
    });

    it('returns undefined for non-existent file', async () => {
      const file = createMockFile('nonexistent.pdf', 1024);
      expect(await pdfCache.get(file)).toBeUndefined();
      expect(await pdfCache.has(file)).toBe(false);
    });

    it('updates existing entry', async () => {
      const file = createMockFile('test.pdf', 1024);
      const entry1 = { pdf: { numPages: 5 } };
      const entry2 = { pdf: { numPages: 10 } };
      await pdfCache.set(file, entry1);
      await pdfCache.set(file, entry2);
      expect(await pdfCache.get(file)).toEqual(entry2);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when cache is full', async () => {
      const files = [
        createMockFile('file1.pdf', 1024),
        createMockFile('file2.pdf', 2048),
        createMockFile('file3.pdf', 3072),
        createMockFile('file4.pdf', 4096),
        createMockFile('file5.pdf', 5120),
      ];

      for (const file of files) {
        await pdfCache.set(file, { pdf: { numPages: 1 } });
      }

      // Cache should now have 5 entries (full)
      expect(await pdfCache.has(files[0])).toBe(true);

      // Add 6th file - should evict first one
      const newFile = createMockFile('file6.pdf', 6144);
      await pdfCache.set(newFile, { pdf: { numPages: 6 } });

      // First file should be evicted
      expect(await pdfCache.has(files[0])).toBe(false);
      expect(await pdfCache.has(newFile)).toBe(true);
    });

    it('does not evict if key already exists', async () => {
      const file = createMockFile('test.pdf', 1024);
      await pdfCache.set(file, { pdf: { numPages: 1 } });

      // Add 4 more different files
      for (let i = 2; i <= 5; i++) {
        await pdfCache.set(createMockFile(`file${i}.pdf`, 1024 * i), { pdf: { numPages: i } });
      }

      // Updating existing file should not evict it
      expect(await pdfCache.has(file)).toBe(true);
    });
  });

  describe('cache key uniqueness', () => {
    it('uses name, size, and content hash for cache key', async () => {
      const file1 = createMockFile('same.pdf', 1024, 1000, 'a');
      const file2 = createMockFile('same.pdf', 1024, 2000, 'b'); // different content
      const file3 = createMockFile('same.pdf', 2048, 1000, 'a'); // different size

      await pdfCache.set(file1, { pdf: { numPages: 1 } });
      await pdfCache.set(file2, { pdf: { numPages: 2 } });
      await pdfCache.set(file3, { pdf: { numPages: 3 } });

      expect(await pdfCache.has(file1)).toBe(true);
      expect(await pdfCache.has(file2)).toBe(true);
      expect(await pdfCache.has(file3)).toBe(true);
    });

    it('does not collide two same-size files that share a long prefix', async () => {
      const size = 8192;
      const makeFile = (name: string, tailByte: number): File => {
        const bytes = new Uint8Array(size);
        // Identical first half, different tail: hashing only the head used to
        // make these two files share a cache entry.
        bytes.fill(7, 0, size / 2);
        bytes.fill(tailByte, size / 2);

        return {
          name,
          size,
          lastModified: 1000,
          slice: (start?: number, end?: number) => ({
            arrayBuffer: async () => bytes.slice(start ?? 0, end ?? size).buffer,
          }),
        } as unknown as File;
      };

      const fileA = makeFile('same.pdf', 1);
      const fileB = makeFile('same.pdf', 2);

      await pdfCache.set(fileA, { pdf: { numPages: 1 } });

      expect(await pdfCache.has(fileB)).toBe(false);
      expect(await pdfCache.has(fileA)).toBe(true);
    });
  });

  describe('clear', () => {
    it('removes all entries from cache', async () => {
      const file1 = createMockFile('file1.pdf', 1024);
      const file2 = createMockFile('file2.pdf', 2048);
      await pdfCache.set(file1, { pdf: { numPages: 1 } });
      await pdfCache.set(file2, { pdf: { numPages: 2 } });

      pdfCache.clear();

      expect(await pdfCache.has(file1)).toBe(false);
      expect(await pdfCache.has(file2)).toBe(false);
    });
  });
});
