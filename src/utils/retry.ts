/**
 * Retry Utilities
 *
 * Provides retry logic with exponential backoff for failed operations.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  delay?: number;
  /** Backoff multiplier for each retry */
  backoff?: number;
  /** Callback when a retry occurs */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  /** Whether to retry on specific errors only */
  retryOn?: ((error: Error) => boolean) | Error[];
  /** Context identifier for logging */
  context?: string;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Executes a function with retry logic and exponential backoff.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Result containing success status and either result or error
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, delay: 1000, backoff: 2 }
 * );
 * if (result.success) {
 *   console.log('Data:', result.result);
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts');
 * }
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
    retryOn,
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let lastAttempt = 1;

  // Normalize retryOn to a function
  let shouldRetry: (error: Error) => boolean;
  if (Array.isArray(retryOn)) {
    const errorTypes = retryOn as unknown as (new (...args: any[]) => Error)[];
    shouldRetry = (error: Error) =>
      errorTypes.some(e => {
        const errorName = (e as any).name || (e as any).prototype?.name;
        return (
          error.name === errorName ||
          error.message?.includes(errorName)
        );
      });
  } else if (typeof retryOn === 'function') {
    shouldRetry = retryOn;
  } else {
    shouldRetry = () => true;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastAttempt = attempt;
    try {
      const result = await fn();
      return {
        success: true,
        result,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        break;
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      onRetry?.(attempt, lastError, waitTime);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: lastAttempt,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Creates a retry wrapper for a specific function.
 *
 * @param fn - The function to wrap with retry
 * @param options - Default retry options
 * @returns A wrapped function that automatically retries
 *
 * @example
 * const safeFetch = withRetryWrapper(fetch, { maxAttempts: 3 });
 * const result = await safeFetch('/api/data');
 */
export function withRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<RetryResult<Awaited<ReturnType<T>>>> {
  return async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Type guard for RetryResult success.
 */
export function isRetrySuccess<T>(result: RetryResult<T>): result is RetryResult<T> & { result: T } {
  return result.success && result.result !== undefined;
}

/**
 * Type guard for RetryResult failure.
 */
export function isRetryFailure<T>(result: RetryResult<T>): result is RetryResult<T> & { error: Error } {
  return !result.success && result.error !== undefined;
}