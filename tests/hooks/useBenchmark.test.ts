import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBenchmark } from '../../src/hooks/useBenchmark';
import { OperationBenchmark } from '../../src/utils/performance';

describe('useBenchmark hook', () => {
  describe('recordBenchmark', () => {
    it('records benchmark data', () => {
      const { result } = renderHook(() => useBenchmark());

      const benchmark: OperationBenchmark = {
        operation: 'merge',
        startTime: 1000,
        endTime: 2000,
        duration: 1000,
        success: true,
      };

      act(() => {
        result.current.recordBenchmark(benchmark);
      });

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks).toHaveLength(1);
      expect(benchmarks[0].operation).toBe('merge');
    });

    it('accumulates multiple benchmarks', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordBenchmark({
          operation: 'merge',
          startTime: 1000,
          endTime: 2000,
          duration: 1000,
          success: true,
        });
        result.current.recordBenchmark({
          operation: 'compress',
          startTime: 2000,
          endTime: 2500,
          duration: 500,
          success: true,
        });
      });

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks).toHaveLength(2);
    });
  });

  describe('getBenchmarks', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => useBenchmark());

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks).toEqual([]);
    });

    it('returns copy of benchmarks array', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordBenchmark({
          operation: 'test',
          startTime: 1000,
          endTime: 2000,
          duration: 1000,
          success: true,
        });
      });

      const benchmarks = result.current.getBenchmarks();
      benchmarks.push({ operation: 'extra' } as OperationBenchmark);

      // Original should be unaffected
      const current = result.current.getBenchmarks();
      expect(current).toHaveLength(1);
    });
  });

  describe('clearBenchmarks', () => {
    it('clears all recorded benchmarks', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordBenchmark({
          operation: 'merge',
          startTime: 1000,
          endTime: 2000,
          duration: 1000,
          success: true,
        });
        result.current.recordBenchmark({
          operation: 'compress',
          startTime: 2000,
          endTime: 2500,
          duration: 500,
          success: true,
        });
      });

      act(() => {
        result.current.clearBenchmarks();
      });

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks).toHaveLength(0);
    });
  });

  describe('recordTiming', () => {
    it('creates and records benchmark from timing data', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordTiming('merge', 1000, 2500, {
          fileSize: 5000000,
          pageCount: 10,
          success: true,
        });
      });

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks).toHaveLength(1);
      expect(benchmarks[0].operation).toBe('merge');
      expect(benchmarks[0].duration).toBe(1500);
      expect(benchmarks[0].fileSize).toBe(5000000);
      expect(benchmarks[0].pageCount).toBe(10);
    });

    it('uses default success value of true', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordTiming('test', 1000, 1500);
      });

      const benchmarks = result.current.getBenchmarks();
      expect(benchmarks[0].success).toBe(true);
    });

    it('accepts all optional parameters', () => {
      const { result } = renderHook(() => useBenchmark());

      act(() => {
        result.current.recordTiming('complex-op', 1000, 3000, {
          memoryBefore: 1000000,
          memoryAfter: 2000000,
          fileSize: 8000000,
          pageCount: 25,
          success: true,
        });
      });

      const benchmarks = result.current.getBenchmarks();
      const b = benchmarks[0];
      expect(b.memoryBefore).toBe(1000000);
      expect(b.memoryAfter).toBe(2000000);
      expect(b.fileSize).toBe(8000000);
      expect(b.pageCount).toBe(25);
      expect(b.duration).toBe(2000);
    });
  });
});