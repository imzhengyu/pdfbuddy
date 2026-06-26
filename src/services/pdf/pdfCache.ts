/** Internal cache entry storing parsed PDF data */
interface CacheEntry {
  /** Parsed PDF document from pdfjs-dist */
  pdf: any;
}

/**
 * LRU cache for parsed PDF documents.
 * Avoids re-parsing the same PDF file multiple times during preview operations.
 * Tracks access order to evict least recently used entries when capacity (5) is reached.
 */
class PDFCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  /**
   * Generates a cache key from a File object.
   * Uses filename, size, and lastModified to uniquely identify files.
   * @param file - File object to generate key for
   * @returns Unique cache key string
   */
  private getCacheKey(file: File): string {
    return `${file.name}_${file.size}_${file.lastModified || 0}`;
  }

  /**
   * Retrieves a cached PDF entry if available.
   * Updates access order for LRU tracking.
   * @param file - File object to look up
   * @returns Cache entry with parsed PDF, or undefined if not found
   */
  get(file: File): CacheEntry | undefined {
    const key = this.getCacheKey(file);
    const entry = this.cache.get(key);
    if (entry) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return entry;
  }

  /**
   * Stores a parsed PDF in the cache.
   * Evicts least recently used entry if cache is at capacity (5).
   * @param file - File object the PDF was parsed from
   * @param entry - Cache entry containing parsed PDF document
   */
  set(file: File, entry: CacheEntry): void {
    const key = this.getCacheKey(file);
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.cache.size >= 5) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  /**
   * Checks if a file has a cached PDF entry.
   * @param file - File object to check
   * @returns True if an entry exists in cache
   */
  has(file: File): boolean {
    return this.cache.has(this.getCacheKey(file));
  }

  /** Clears all entries from the cache */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

/** Singleton instance of PDFCache shared across the application */
export const pdfCache = new PDFCache();