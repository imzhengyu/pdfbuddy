import { describe, it, expect, beforeEach } from 'vitest';
import { pdfCache } from '../../src/services/pdf/pdfCache';

describe('pdfCache', () => {
  const createMockFile = (name: string, size: number, lastModified = 1234567890) => {
    return { name, size, lastModified } as File;
  };

  beforeEach(() => {
    pdfCache.clear();
  });

  describe('get/set/has', () => {
    it('stores and retrieves PDF entry', () => {
      const file = createMockFile('test.pdf', 1024);
      const entry = { pdf: { numPages: 5 } };
      pdfCache.set(file, entry);
      expect(pdfCache.has(file)).toBe(true);
      expect(pdfCache.get(file)).toEqual(entry);
    });

    it('returns undefined for non-existent file', () => {
      const file = createMockFile('nonexistent.pdf', 1024);
      expect(pdfCache.get(file)).toBeUndefined();
      expect(pdfCache.has(file)).toBe(false);
    });

    it('updates existing entry', () => {
      const file = createMockFile('test.pdf', 1024);
      const entry1 = { pdf: { numPages: 5 } };
      const entry2 = { pdf: { numPages: 10 } };
      pdfCache.set(file, entry1);
      pdfCache.set(file, entry2);
      expect(pdfCache.get(file)).toEqual(entry2);
    });
  });

  describe('LRU eviction', () => {
    it('evicts oldest entry when cache is full', () => {
      const files = [
        createMockFile('file1.pdf', 1024),
        createMockFile('file2.pdf', 2048),
        createMockFile('file3.pdf', 3072),
        createMockFile('file4.pdf', 4096),
        createMockFile('file5.pdf', 5120),
      ];

      files.forEach((file, i) => {
        pdfCache.set(file, { pdf: { numPages: i + 1 } });
      });

      // Cache should now have 5 entries (full)
      expect(pdfCache.has(files[0])).toBe(true);

      // Add 6th file - should evict first one
      const newFile = createMockFile('file6.pdf', 6144);
      pdfCache.set(newFile, { pdf: { numPages: 6 } });

      // First file should be evicted
      expect(pdfCache.has(files[0])).toBe(false);
      expect(pdfCache.has(newFile)).toBe(true);
    });

    it('does not evict if key already exists', () => {
      const file = createMockFile('test.pdf', 1024);
      pdfCache.set(file, { pdf: { numPages: 1 } });

      // Add 4 more different files
      for (let i = 2; i <= 5; i++) {
        pdfCache.set(createMockFile(`file${i}.pdf`, 1024 * i), { pdf: { numPages: i } });
      }

      // Updating existing file should not evict it
      expect(pdfCache.has(file)).toBe(true);
    });
  });

  describe('cache key uniqueness', () => {
    it('uses name, size, and lastModified for cache key', () => {
      const file1 = createMockFile('same.pdf', 1024, 1000);
      const file2 = createMockFile('same.pdf', 1024, 2000); // different lastModified
      const file3 = createMockFile('same.pdf', 2048, 1000); // different size

      pdfCache.set(file1, { pdf: { numPages: 1 } });
      pdfCache.set(file2, { pdf: { numPages: 2 } });
      pdfCache.set(file3, { pdf: { numPages: 3 } });

      expect(pdfCache.has(file1)).toBe(true);
      expect(pdfCache.has(file2)).toBe(true);
      expect(pdfCache.has(file3)).toBe(true);
    });
  });

  describe('clear', () => {
    it('removes all entries from cache', () => {
      const file1 = createMockFile('file1.pdf', 1024);
      const file2 = createMockFile('file2.pdf', 2048);
      pdfCache.set(file1, { pdf: { numPages: 1 } });
      pdfCache.set(file2, { pdf: { numPages: 2 } });

      pdfCache.clear();

      expect(pdfCache.has(file1)).toBe(false);
      expect(pdfCache.has(file2)).toBe(false);
    });
  });
});
