import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageOrder, ProcessingProgress } from '../services/pdf/types';

/**
 * Return type for the useOrganize hook containing reorganize function and operation state.
 */
interface UseOrganizeResult {
  /** Reorganizes pages in a PDF file according to the new order. */
  reorganize: (file: File, newOrder: PageOrder[]) => Promise<Blob | null>;
  /** Whether a reorganize operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for reorganizing pages within a PDF file (reordering and deleting).
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseOrganizeResult - Object containing reorganize function and operation state
 *
 * @example
 * ```tsx
 * const { reorganize, isProcessing, progress, error, clearError } = useOrganize();
 *
 * const handleOrganize = async () => {
 *   const result = await reorganize(file, [{ originalIndex: 0, newIndex: 2 }]);
 *   if (result) {
 *     // Download organized PDF
 *   }
 * };
 * ```
 */
export function useOrganize(): UseOrganizeResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    file: File;
    newOrder: PageOrder[];
  }>({
    validate: ({ newOrder }) => {
      if (!newOrder.length) {
        return 'Please select pages to reorganize';
      }
      return null;
    },
    execute: async ({ file, newOrder }, service, setProgress) => {
      return service.reorganize(file, newOrder, setProgress);
    },
    getProgressTotal: ({ newOrder }) => newOrder.length,
  });

  const reorganize = useCallback(
    async (file: File, newOrder: PageOrder[]) =>
      operation({ file, newOrder }),
    [operation]
  );

  return { reorganize, isProcessing, progress, error, clearError };
}
