import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, withRetryWrapper, isRetrySuccess, isRetryFailure } from '../../src/utils/retry';

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('withRetry', () => {
    it('returns result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { maxAttempts: 3 });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 1000, backoff: 2 });

      // Wait for all retries
      await vi.advanceTimersByTimeAsync(3000);

      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(3);
    });

    it('returns error after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 1000 });

      // Wait for all retries
      await vi.advanceTimersByTimeAsync(4000);

      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(3);
    });

    it('calls onRetry callback', async () => {
      const onRetry = vi.fn();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { maxAttempts: 3, delay: 1000, onRetry });

      await vi.advanceTimersByTimeAsync(2000);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Number), expect.any(Error), expect.any(Number));
    });

    it('respects retryOn filter function', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('network'));

      const result = await withRetry(fn, {
        maxAttempts: 3,
        delay: 100,
        retryOn: (error) => error.message !== 'network',
      });

      // Should not retry because retryOn returns false for 'network' error
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('measures total time', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const resultPromise = withRetry(fn, { maxAttempts: 2, delay: 1000 });

      await vi.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      expect(result.totalTime).toBeGreaterThan(0);
    });
  });

  describe('withRetryWrapper', () => {
    it('wraps function with retry logic', async () => {
      const myFn = vi.fn().mockResolvedValue('wrapped');

      const safeFn = withRetryWrapper(myFn, { maxAttempts: 3 });
      const result = await safeFn();

      expect(result.success).toBe(true);
      expect(result.result).toBe('wrapped');
    });

    it('passes arguments to wrapped function', async () => {
      const myFn = vi.fn().mockResolvedValue((a: number, b: number) => a + b);

      const safeFn = withRetryWrapper(myFn);
      const result = await safeFn(2, 3);

      expect(result.success).toBe(true);
    });
  });

  describe('isRetrySuccess', () => {
    it('returns true for successful result', () => {
      const result = { success: true, result: 'data', attempts: 1, totalTime: 100 };
      expect(isRetrySuccess(result)).toBe(true);
    });

    it('returns false for failed result', () => {
      const result = { success: false, error: new Error('fail'), attempts: 3, totalTime: 100 };
      expect(isRetrySuccess(result)).toBe(false);
    });
  });

  describe('isRetryFailure', () => {
    it('returns true for failed result', () => {
      const result = { success: false, error: new Error('fail'), attempts: 3, totalTime: 100 };
      expect(isRetryFailure(result)).toBe(true);
    });

    it('returns false for successful result', () => {
      const result = { success: true, result: 'data', attempts: 1, totalTime: 100 };
      expect(isRetryFailure(result)).toBe(false);
    });
  });
});