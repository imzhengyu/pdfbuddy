import { useState, useCallback, useMemo } from 'react';
import { getClientPDFService } from '../services/pdf/ClientPDFService';
import { ProcessingProgress } from '../services/pdf/types';

/**
 * Configuration object for PDF operations via usePDFOperation hook.
 * @template TParams - Type of parameters passed to the operation
 * @template TResult - Type the operation resolves to (before the null-on-error wrapper)
 * @param validate - Function to validate operation parameters, returns error message or null
 * @param execute - Async function that performs the actual PDF operation
 * @param getProgressTotal - Function that returns the total units of work for progress tracking
 */
export interface PDFOperationConfig<TParams, TResult> {
  /** Validates operation parameters. Returns null if valid, or an error message string if invalid. */
  validate: (params: TParams) => string | null;
  /** Executes the PDF operation. Receives params, service instance, and progress callback. */
  execute: (
    params: TParams,
    service: ReturnType<typeof getClientPDFService>,
    setProgress: (progress: ProcessingProgress) => void
  ) => Promise<TResult>;
  /** Returns the total number of work units for progress calculation. */
  getProgressTotal: (params: TParams) => number;
}

/**
 * Custom hook that manages state and execution for PDF operations.
 * Handles validation, progress tracking, error handling, and operation lifecycle.
 *
 * @template TParams - Type of parameters the operation accepts
 * @template TResult - Type the operation resolves to
 * @param config - Configuration object with validate, execute, and getProgressTotal functions
 * @returns Object containing operation function, processing state, progress, error, and clearError handler
 *
 * @example
 * ```tsx
 * const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{ file: File }>({
 *   validate: ({ file }) => file ? null : 'No file provided',
 *   execute: async ({ file }, service, setProgress) => {
 *     return service.rotate(file, [{ pageIndex: 0, type: 'rotate', degrees: 90 }], setProgress);
 *   },
 *   getProgressTotal: () => 1,
 * });
 * ```
 */
export function usePDFOperation<TParams, TResult = unknown>(
  config: PDFOperationConfig<TParams, TResult>
): {
  operation: (params: TParams) => Promise<TResult | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
} {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => getClientPDFService(), []);

  const operation = useCallback(
    async (params: TParams): Promise<TResult | null> => {
      const validationError = config.validate(params);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setIsProcessing(true);
      setError(null);
      const total = config.getProgressTotal(params);
      setProgress({ current: 0, total, percent: 0 });

      try {
        const result = await config.execute(params, service, setProgress);
        setProgress({ current: total, total, percent: 100 });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Operation failed';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [config, service]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { operation, isProcessing, progress, error, clearError };
}
