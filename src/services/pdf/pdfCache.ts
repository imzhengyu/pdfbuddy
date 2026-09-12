import { CONST_CACHE_CONFIG } from '../../config';

/** Internal cache entry storing parsed PDF data */
interface CacheEntry {
  /** Parsed PDF document from pdfjs-dist */
  pdf: any;
}

/**
 * Computes a content-based hash for a File.
 *
 * Samples the head and the tail of the file: hashing only the first few
 * kilobytes made two same-size files with a shared prefix collide, so the cache
 * could serve the wrong document.
 *
 * Returns the first 16 hex characters of the SHA-256 digest.
 */
async function computeContentHash(file: File): Promise<string> {
  const sampleSize = CONST_CACHE_CONFIG.contentHashSampleSize;
  const headSize = Math.min(sampleSize, file.size);
  const head = await file.slice(0, headSize).arrayBuffer();

  let tail = new ArrayBuffer(0);
  if (file.size > headSize) {
    tail = await file.slice(Math.max(headSize, file.size - sampleSize)).arrayBuffer();
  }

  const sample = new Uint8Array(head.byteLength + tail.byteLength);
  sample.set(new Uint8Array(head), 0);
  sample.set(new Uint8Array(tail), head.byteLength);

  const hashBuffer = await crypto.subtle.digest('SHA-256', sample);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * LRU cache for parsed PDF documents.
 * Avoids re-parsing the same PDF file multiple times during preview operations.
 * Tracks access order to evict least recently used entries when capacity is reached.
 * Cache keys include a content hash for stronger identity than filename/size/lastModified.
 */
class PDFCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  /**
   * Generates a cache key from a File object.
   * Uses filename, size, and a content hash to uniquely identify files.
   * @param file - File object to generate key for
   * @param contentHash - Precomputed content hash
   * @returns Unique cache key string
   */
  private getCacheKey(file: File, contentHash: string): string {
    return `${file.name}_${file.size}_${contentHash}`;
  }

  /**
   * Retrieves a cached PDF entry if available.
   * Updates access order for LRU tracking.
   * @param file - File object to look up
   * @returns Promise resolving to cache entry with parsed PDF, or undefined if not found
   */
  async get(file: File): Promise<CacheEntry | undefined> {
    const hash = await computeContentHash(file);
    const key = this.getCacheKey(file, hash);
    const entry = this.cache.get(key);
    if (entry) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      this.accessOrder.push(key);
    }
    return entry;
  }

  /**
   * Stores a parsed PDF in the cache.
   * Evicts least recently used entry if cache is at capacity.
   * @param file - File object the PDF was parsed from
   * @param entry - Cache entry containing parsed PDF document
   */
  async set(file: File, entry: CacheEntry): Promise<void> {
    const hash = await computeContentHash(file);
    const key = this.getCacheKey(file, hash);
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    } else if (this.cache.size >= CONST_CACHE_CONFIG.pdfCacheCapacity) {
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
   * @returns Promise resolving to true if an entry exists in cache
   */
  async has(file: File): Promise<boolean> {
    const hash = await computeContentHash(file);
    const key = this.getCacheKey(file, hash);
    return this.cache.has(key);
  }

  /** Clears all entries from the cache */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
}

/** Singleton instance of PDFCache shared across the application */
export const pdfCache = new PDFCache();
