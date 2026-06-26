/**
 * Performance benchmarking utilities for tracking operation times and memory usage.
 * Provides a foundation for establishing performance baselines and monitoring PDF operations.
 */

/**
 * Benchmark data for a single operation.
 */
export interface OperationBenchmark {
  /** Name of the operation performed */
  operation: string;
  /** Timestamp when operation started (ms since epoch) */
  startTime: number;
  /** Timestamp when operation ended (ms since epoch) */
  endTime: number;
  /** Duration of operation in milliseconds */
  duration: number;
  /** Estimated memory usage before operation (bytes) */
  memoryBefore?: number;
  /** Estimated memory usage after operation (bytes) */
  memoryAfter?: number;
  /** Size of the file being processed (bytes) */
  fileSize?: number;
  /** Number of pages in the PDF */
  pageCount?: number;
  /** Whether the operation completed successfully */
  success: boolean;
}

/**
 * Configuration options for timing a function.
 */
export interface MeasureTimeOptions {
  /** Optional operation name for the benchmark record */
  operation?: string;
  /** Whether to track memory usage (adds small overhead) */
  trackMemory?: boolean;
  /** Optional file size for the benchmark */
  fileSize?: number;
  /** Optional page count for the benchmark */
  pageCount?: number;
}

/**
 * Result from measuring execution time.
 */
export interface MeasureTimeResult<T> {
  /** The return value from the function */
  result: T;
  /** Duration in milliseconds */
  duration: number;
  /** Optional benchmark record if recording is enabled */
  benchmark?: OperationBenchmark;
}

/**
 * Memory usage snapshot.
 */
export interface MemorySnapshot {
  /** Estimated used memory in bytes */
  used: number;
  /** Timestamp of snapshot */
  timestamp: number;
}

/**
 * Simple memory monitor for tracking rough memory usage.
 * Uses performance.memory API where available (Chrome).
 */
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private readonly maxSnapshots = 10;

  /**
   * Get current memory usage if available.
   * Returns undefined if the memory API is not available.
   */
  getCurrentUsage(): number | undefined {
    // performance.memory is available in Chrome
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Take a memory snapshot.
   * @returns MemorySnapshot with current memory usage and timestamp
   */
  snapshot(): MemorySnapshot {
    const used = this.getCurrentUsage();
    const snapshot: MemorySnapshot = {
      used: used ?? 0,
      timestamp: Date.now(),
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    return snapshot;
  }

  /**
   * Get all recorded snapshots.
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Clear all recorded snapshots.
   */
  clear(): void {
    this.snapshots = [];
  }

  /**
   * Calculate approximate memory delta between snapshots.
   * @param before - Earlier snapshot
   * @param after - Later snapshot
   * @returns Memory delta in bytes (positive = increase)
   */
  static delta(before: MemorySnapshot, after: MemorySnapshot): number {
    return after.used - before.used;
  }
}

/**
 * Measure the execution time of an async function.
 *
 * @param fn - Async function to measure
 * @param options - Optional configuration
 * @returns Promise resolving to result and duration
 *
 * @example
 * ```typescript
 * const { result, duration } = await measureTime(async () => {
 *   return service.merge(files);
 * });
 * ```
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  options: MeasureTimeOptions = {}
): Promise<MeasureTimeResult<T>> {
  const { trackMemory = false, operation, fileSize, pageCount } = options;

  const memMonitor = trackMemory ? new MemoryMonitor() : null;
  const memBefore = memMonitor?.snapshot();

  const startTime = performance.now();
  let result: T;
  let success = true;

  try {
    result = await fn();
  } catch (err) {
    success = false;
    throw err;
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  if (memMonitor && memBefore) {
    const memAfter = memMonitor.snapshot();
    const benchmark: OperationBenchmark = {
      operation: operation ?? 'unknown',
      startTime: Math.floor(startTime),
      endTime: Math.floor(endTime),
      duration: Math.round(duration),
      memoryBefore: memBefore.used,
      memoryAfter: memAfter.used,
      fileSize,
      pageCount,
      success,
    };
    return { result, duration, benchmark };
  }

  return { result, duration };
}

/**
 * Create a benchmark record from timing data.
 *
 * @param operation - Operation name
 * @param startTime - Start timestamp (performance.now() value)
 * @param endTime - End timestamp (performance.now() value)
 * @param options - Additional benchmark data
 * @returns OperationBenchmark record
 */
export function createBenchmark(
  operation: string,
  startTime: number,
  endTime: number,
  options: {
    memoryBefore?: number;
    memoryAfter?: number;
    fileSize?: number;
    pageCount?: number;
    success?: boolean;
  } = {}
): OperationBenchmark {
  return {
    operation,
    startTime: Math.floor(startTime),
    endTime: Math.floor(endTime),
    duration: Math.round(endTime - startTime),
    memoryBefore: options.memoryBefore,
    memoryAfter: options.memoryAfter,
    fileSize: options.fileSize,
    pageCount: options.pageCount,
    success: options.success ?? true,
  };
}

/**
 * Format duration in milliseconds for display.
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "1.23s" or "456ms")
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Format bytes for display.
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const formatted = i === 0 ? value.toString() : value.toFixed(2);
  return `${formatted} ${units[i]}`;
}