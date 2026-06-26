import { useCallback, useRef } from 'react';
import { OperationBenchmark, createBenchmark } from '../utils/performance';

/**
 * Return type for the useBenchmark hook.
 */
export interface UseBenchmarkResult {
  /** Records a benchmark for an operation */
  recordBenchmark: (benchmark: OperationBenchmark) => void;
  /** Gets all recorded benchmarks */
  getBenchmarks: () => OperationBenchmark[];
  /** Clears all recorded benchmarks */
  clearBenchmarks: () => void;
  /** Records timing for an operation directly */
  recordTiming: (
    operation: string,
    startTime: number,
    endTime: number,
    options?: {
      memoryBefore?: number;
      memoryAfter?: number;
      fileSize?: number;
      pageCount?: number;
      success?: boolean;
    }
  ) => void;
}

/**
 * Custom hook for recording and retrieving performance benchmarks.
 * Stores benchmarks in memory for the session.
 *
 * @returns UseBenchmarkResult - Object containing benchmark management functions
 *
 * @example
 * ```tsx
 * const { recordBenchmark, getBenchmarks, clearBenchmarks, recordTiming } = useBenchmark();
 *
 * // Record timing manually
 * recordTiming('merge', startTime, endTime, { fileSize: 1024, pageCount: 5 });
 *
 * // Get all benchmarks
 * const benchmarks = getBenchmarks();
 * ```
 */
export function useBenchmark(): UseBenchmarkResult {
  const benchmarksRef = useRef<OperationBenchmark[]>([]);

  const recordBenchmark = useCallback((benchmark: OperationBenchmark) => {
    benchmarksRef.current.push(benchmark);
  }, []);

  const getBenchmarks = useCallback(() => {
    return [...benchmarksRef.current];
  }, []);

  const clearBenchmarks = useCallback(() => {
    benchmarksRef.current = [];
  }, []);

  const recordTiming = useCallback(
    (
      operation: string,
      startTime: number,
      endTime: number,
      options?: {
        memoryBefore?: number;
        memoryAfter?: number;
        fileSize?: number;
        pageCount?: number;
        success?: boolean;
      }
    ) => {
      const benchmark = createBenchmark(operation, startTime, endTime, options);
      benchmarksRef.current.push(benchmark);
    },
    []
  );

  return {
    recordBenchmark,
    getBenchmarks,
    clearBenchmarks,
    recordTiming,
  };
}