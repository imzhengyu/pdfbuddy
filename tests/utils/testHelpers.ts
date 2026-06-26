import { vi } from 'vitest';
import type { ProcessingProgress, PageRange, PageRotation, PageOrder, CompressionQuality } from '../../src/services/pdf/types';

/**
 * Creates a mock File object with all necessary methods properly mocked.
 * This ensures tests accurately represent real File behavior.
 */
export function createMockFile(
  content: string | Uint8Array,
  name: string,
  options?: {
    type?: string;
    lastModified?: number;
    size?: number;
  }
): File {
  const data = content instanceof Uint8Array
    ? content
    : new TextEncoder().encode(content);

  const blob = new Blob([data], { type: options?.type || 'application/pdf' });

  // Create a mock file with explicit properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockFile: any = {
    name,
    size: options?.size ?? data.byteLength,
    type: options?.type || 'application/pdf',
    lastModified: options?.lastModified || Date.now(),
    webkitRelativePath: '',
    [Symbol.toStringTag]: 'File',
  };

  // Add arrayBuffer method
  mockFile.arrayBuffer = vi.fn().mockResolvedValue(data.buffer);

  // Add slice method
  mockFile.slice = vi.fn().mockReturnValue({
    arrayBuffer: vi.fn().mockResolvedValue(data.buffer)
  });

  // Add stream method - Blob.stream may not exist in jsdom, so mock it
  mockFile.stream = vi.fn().mockReturnValue({
    getReader: vi.fn().mockReturnValue({
      read: vi.fn().mockResolvedValue({ done: true, value: new Uint8Array() })
    })
  });

  return mockFile as File;
}

/**
 * Creates a mock File specifically for PDF files.
 */
export function createMockPDFFile(content: string | Uint8Array, name: string): File {
  return createMockFile(content, name, { type: 'application/pdf' });
}

/**
 * Creates a valid minimal PDF content (magic bytes only).
 */
export function createValidPDFContent(): Uint8Array {
  return new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A, // %PDF-1.4\n
    0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A, // %EOF
  ]);
}

/**
 * Creates a mock PDF document using pdf-lib structure.
 */
export function createMockPDFDocument(options?: {
  pageCount?: number;
  pages?: unknown[];
  withAnnotations?: boolean;
}): {
  getPageCount: ReturnType<typeof vi.fn>;
  getPage: ReturnType<typeof vi.fn>;
  copyPages: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  pages: unknown[];
} {
  const pageCount = options?.pageCount || 5;
  const mockPages = options?.pages || Array(pageCount).fill(null).map(() => ({}));

  return {
    getPageCount: vi.fn().mockReturnValue(pageCount),
    getPage: vi.fn().mockImplementation((index: number) => mockPages[index]),
    copyPages: vi.fn().mockResolvedValue(mockPages.map(() => ({ addPage: vi.fn() }))),
    addPage: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    pages: mockPages,
  };
}

/**
 * Creates a mock for pdf-lib's PDFDocument.
 */
export function createMockPDFDocumentLibrary(): {
  create: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
} {
  return {
    create: vi.fn().mockResolvedValue(createMockPDFDocument()),
    load: vi.fn().mockResolvedValue(createMockPDFDocument()),
  };
}

/**
 * Creates a mock ClientPDFService with configurable behavior.
 */
export interface MockClientPDFServiceConfig {
  merge?: {
    result?: Blob;
    error?: Error;
    delay?: number;
  };
  split?: {
    result?: Blob[];
    error?: Error;
    delay?: number;
  };
  compress?: {
    result?: Blob;
    error?: Error;
    delay?: number;
  };
  rotate?: {
    result?: Blob;
    error?: Error;
    delay?: number;
  };
  convertToPDF?: {
    result?: Blob;
    error?: Error;
    delay?: number;
  };
  reorganize?: {
    result?: Blob;
    error?: Error;
    delay?: number;
  };
  convertToImages?: {
    result?: Blob[];
    error?: Error;
    delay?: number;
  };
}

function createDelayedPromise<T>(value: T, delay: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

function createDelayedRejectedPromise<T>(error: Error, delay: number): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(error), delay));
}

/**
 * Creates a mock ClientPDFService instance.
 */
export function createMockClientPDFService(config: MockClientPDFServiceConfig = {}) {
  return {
    merge: vi.fn().mockImplementation(async (files: File[], onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.merge?.delay) {
        return createDelayedPromise(config.merge.result || new Blob(), config.merge.delay);
      }
      if (config.merge?.error) {
        throw config.merge.error;
      }
      if (config.merge?.result) {
        return config.merge.result;
      }
      // Default: return empty blob, call progress if provided
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return new Blob();
    }),
    split: vi.fn().mockImplementation(async (file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.split?.delay) {
        return createDelayedPromise(config.split.result || [new Blob()], config.split.delay);
      }
      if (config.split?.error) {
        throw config.split.error;
      }
      if (config.split?.result) {
        return config.split.result;
      }
      // Default: return single blob, call progress if provided
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return [new Blob(['split'], { type: 'application/pdf' })];
    }),
    compress: vi.fn().mockImplementation(async (file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.compress?.delay) {
        return createDelayedPromise(config.compress.result || new Blob(), config.compress.delay);
      }
      if (config.compress?.error) {
        throw config.compress.error;
      }
      if (config.compress?.result) {
        return config.compress.result;
      }
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return new Blob(['compressed'], { type: 'application/pdf' });
    }),
    rotate: vi.fn().mockImplementation(async (file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.rotate?.delay) {
        return createDelayedPromise(config.rotate.result || new Blob(), config.rotate.delay);
      }
      if (config.rotate?.error) {
        throw config.rotate.error;
      }
      if (config.rotate?.result) {
        return config.rotate.result;
      }
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return new Blob(['rotated'], { type: 'application/pdf' });
    }),
    convertToPDF: vi.fn().mockImplementation(async (files: File[], onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.convertToPDF?.delay) {
        return createDelayedPromise(config.convertToPDF.result || new Blob(), config.convertToPDF.delay);
      }
      if (config.convertToPDF?.error) {
        throw config.convertToPDF.error;
      }
      if (config.convertToPDF?.result) {
        return config.convertToPDF.result;
      }
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return new Blob(['converted'], { type: 'application/pdf' });
    }),
    reorganize: vi.fn().mockImplementation(async (file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void) => {
      if (config.reorganize?.delay) {
        return createDelayedPromise(config.reorganize.result || new Blob(), config.reorganize.delay);
      }
      if (config.reorganize?.error) {
        throw config.reorganize.error;
      }
      if (config.reorganize?.result) {
        return config.reorganize.result;
      }
      if (onProgress) onProgress({ current: 1, total: 1, progress: 100 });
      return new Blob(['reorganized'], { type: 'application/pdf' });
    }),
    convertToImages: vi.fn().mockImplementation(async () => {
      if (config.convertToImages?.error) {
        throw config.convertToImages.error;
      }
      throw new Error('PDF to images conversion not supported in browser');
    }),
  };
}

/**
 * Creates a mock PDF.js getDocument response.
 */
export function createMockPDFJSDocument(options?: {
  numPages?: number;
  getPageError?: boolean;
  renderError?: boolean;
}) {
  const numPages = options?.numPages || 3;

  return {
    promise: Promise.resolve({
      numPages,
      getPage: vi.fn().mockImplementation(async (index: number) => {
        if (options?.getPageError) {
          throw new Error('Failed to get page');
        }
        return {
          getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
          render: vi.fn().mockImplementation(() => {
            if (options?.renderError) {
              return Promise.reject(new Error('Render failed'));
            }
            return { promise: Promise.resolve() };
          }),
        };
      }),
    }),
  };
}

/**
 * Helper to wait for a condition with better error messaging.
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    onTimeout?: () => void;
  }
): Promise<void> {
  const timeout = options?.timeout || 1000;
  const interval = options?.interval || 50;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  if (options?.onTimeout) {
    options.onTimeout();
  }
  throw new Error(`waitForCondition timed out after ${timeout}ms`);
}