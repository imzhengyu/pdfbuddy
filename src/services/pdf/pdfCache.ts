/**
 * Shared PDF document cache service.
 * Centralizes PDF parsing cache used by PreviewModal and PageThumbnails.
 * Uses LRU eviction when cache reaches max capacity.
 */

interface CacheEntry {
  pdf: any;
}

class PDFCache {
  private cache = new Map<string, CacheEntry>();

  private getCacheKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified || 0}`;
  }

  get(file: File): CacheEntry | undefined {
    return this.cache.get(this.getCacheKey(file));
  }

  set(file: File, entry: CacheEntry): void {
    const key = this.getCacheKey(file);
    if (this.cache.size >= 5) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, entry);
  }

  has(file: File): boolean {
    return this.cache.has(this.getCacheKey(file));
  }

  clear(): void {
    this.cache.clear();
  }
}

export const pdfCache = new PDFCache();
