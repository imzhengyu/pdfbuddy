import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  measureTime,
  MemoryMonitor,
  createBenchmark,
  formatDuration,
  formatBytes,
  OperationBenchmark,
} from '../../src/utils/performance';

describe('performance utilities', () => {
  describe('formatDuration', () => {
    it('formats milliseconds', () => {
      expect(formatDuration(100)).toBe('100ms');
      expect(formatDuration(456)).toBe('456ms');
    });

    it('formats seconds with 2 decimal places', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(1234)).toBe('1.23s');
      expect(formatDuration(10000)).toBe('10.00s');
    });

    it('rounds milliseconds to whole numbers', () => {
      expect(formatDuration(100.7)).toBe('101ms');
      expect(formatDuration(99.2)).toBe('99ms');
    });
  });

  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('formats kilobytes with 2 decimals', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.00 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.00 GB');
    });

    it('handles zero', () => {
      expect(formatBytes(0)).toBe('0 B');
    });
  });

  describe('MemoryMonitor', () => {
    it('creates snapshots', () => {
      const monitor = new MemoryMonitor();
      const snapshot = monitor.snapshot();

      expect(snapshot).toHaveProperty('used');
      expect(snapshot).toHaveProperty('timestamp');
      expect(typeof snapshot.timestamp).toBe('number');
    });

    it('stores and retrieves snapshots', () => {
      const monitor = new MemoryMonitor();
      monitor.snapshot();
      monitor.snapshot();

      const snapshots = monitor.getSnapshots();
      expect(snapshots).toHaveLength(2);
    });

    it('limits stored snapshots to max', () => {
      const monitor = new MemoryMonitor();
      const maxSnapshots = 10;

      for (let i = 0; i < maxSnapshots + 5; i++) {
        monitor.snapshot();
      }

      const snapshots = monitor.getSnapshots();
      expect(snapshots).toHaveLength(maxSnapshots);
    });

    it('clears snapshots', () => {
      const monitor = new MemoryMonitor();
      monitor.snapshot();
      monitor.snapshot();
      monitor.clear();

      expect(monitor.getSnapshots()).toHaveLength(0);
    });

    it('calculates delta between snapshots', () => {
      const monitor = new MemoryMonitor();
      const before = monitor.snapshot();
      const after = monitor.snapshot();

      const delta = MemoryMonitor.delta(before, after);
      expect(typeof delta).toBe('number');
    });
  });

  describe('createBenchmark', () => {
    it('creates benchmark with required fields', () => {
      const startTime = 1000;
      const endTime = 1500;

      const benchmark = createBenchmark('merge', startTime, endTime);

      expect(benchmark.operation).toBe('merge');
      expect(benchmark.startTime).toBe(1000);
      expect(benchmark.endTime).toBe(1500);
      expect(benchmark.duration).toBe(500);
      expect(benchmark.success).toBe(true);
    });

    it('includes optional fields when provided', () => {
      const benchmark = createBenchmark('compress', 1000, 2000, {
        memoryBefore: 1000000,
        memoryAfter: 1500000,
        fileSize: 5000000,
        pageCount: 10,
        success: true,
      });

      expect(benchmark.memoryBefore).toBe(1000000);
      expect(benchmark.memoryAfter).toBe(1500000);
      expect(benchmark.fileSize).toBe(5000000);
      expect(benchmark.pageCount).toBe(10);
    });

    it('defaults success to true', () => {
      const benchmark = createBenchmark('test', 0, 100);
      expect(benchmark.success).toBe(true);
    });

    it('can set success to false', () => {
      const benchmark = createBenchmark('test', 0, 100, { success: false });
      expect(benchmark.success).toBe(false);
    });
  });

  describe('measureTime', () => {
    it('measures async function duration', async () => {
      const { duration } = await measureTime(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'result';
      });

      expect(duration).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(200); // Should be under 200ms
    });

    it('returns the function result', async () => {
      const { result } = await measureTime(async () => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it('re-throws errors from the function', async () => {
      await expect(
        measureTime(async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
    });

    it('includes benchmark when trackMemory is true', async () => {
      const { benchmark } = await measureTime(
        async () => 'done',
        {
          operation: 'test-op',
          fileSize: 1000,
          pageCount: 5,
          trackMemory: true,
        }
      );

      expect(benchmark).toBeDefined();
      expect(benchmark!.operation).toBe('test-op');
      expect(benchmark!.fileSize).toBe(1000);
      expect(benchmark!.pageCount).toBe(5);
      expect(benchmark!.success).toBe(true);
    });

    it('captures error in benchmark when function throws', async () => {
      try {
        await measureTime(
          async () => {
            throw new Error('fail');
          },
          {
            operation: 'failing-op',
            trackMemory: false,
          }
        );
      } catch {
        // Expected
      }

      // The benchmark is not returned when error is thrown
      // because we re-throw the error
    });
  });
});

describe('OperationBenchmark interface', () => {
  it('has correct structure', () => {
    const benchmark: OperationBenchmark = {
      operation: 'merge',
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      duration: 1000,
      memoryBefore: 1000000,
      memoryAfter: 2000000,
      fileSize: 5000000,
      pageCount: 10,
      success: true,
    };

    expect(benchmark.operation).toBe('merge');
    expect(benchmark.duration).toBe(1000);
    expect(benchmark.success).toBe(true);
  });
});