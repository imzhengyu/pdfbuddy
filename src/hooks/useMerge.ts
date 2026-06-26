import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { ProcessingProgress } from '../services/pdf/types';

/**
 * Return type for the useMerge hook containing merge function and operation state.
 */
interface UseMergeResult {
  /** Merges multiple PDF files into a single PDF blob. */
  merge: (files: File[]) => Promise<Blob | null>;
  /** Whether a merge operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for merging multiple PDF files into a single PDF document.
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseMergeResult - Object containing merge function and operation state
 *
 * @example
 * ```tsx
 * const { merge, isProcessing, progress, error, clearError } = useMerge();
 *
 * const handleMerge = async () => {
 *   const result = await merge(fileList);
 *   if (result) {
 *     // Download merged PDF
 *   }
 * };
 * ```
 */
export function useMerge(): UseMergeResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<File[]>({
    validate: (files) => {
      if (files.length < 2) {
        return 'Please select at least 2 PDF files to merge';
      }
      return null;
    },
    execute: async (files, service, setProgress) => {
      return service.merge(files, setProgress);
    },
    getProgressTotal: (files) => files.length,
  });

  const merge = useCallback(
    async (files: File[]) => operation(files),
    [operation]
  );

  return { merge, isProcessing, progress, error, clearError };
}
