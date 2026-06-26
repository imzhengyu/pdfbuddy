import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageRange, ProcessingProgress } from '../services/pdf/types';

/**
 * Return type for the useSplit hook containing split function and operation state.
 */
interface UseSplitResult {
  /** Splits a PDF file at the specified page ranges. */
  split: (file: File, pageRanges: PageRange[]) => Promise<Blob[] | null>;
  /** Whether a split operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for splitting a PDF file into multiple PDFs at specified page ranges.
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseSplitResult - Object containing split function and operation state
 *
 * @example
 * ```tsx
 * const { split, isProcessing, progress, error, clearError } = useSplit();
 *
 * const handleSplit = async () => {
 *   const result = await split(file, [{ start: 1, end: 3 }, { start: 5, end: 7 }]);
 *   if (result) {
 *     // Handle split PDFs
 *   }
 * };
 * ```
 */
export function useSplit(): UseSplitResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    file: File;
    pageRanges: PageRange[];
  }>({
    validate: ({ pageRanges }) => {
      if (!pageRanges.length) {
        return 'Please specify at least one page range to split';
      }
      return null;
    },
    execute: async ({ file, pageRanges }, service, setProgress) => {
      return service.split(file, pageRanges, setProgress);
    },
    getProgressTotal: ({ pageRanges }) => pageRanges.length,
  });

  const split = useCallback(
    async (file: File, pageRanges: PageRange[]) =>
      operation({ file, pageRanges }),
    [operation]
  );

  return { split, isProcessing, progress, error, clearError };
}
