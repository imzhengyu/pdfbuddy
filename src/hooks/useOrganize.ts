import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageOrder, ProcessingProgress } from '../services/pdf/types';

interface UseOrganizeResult {
  reorganize: (file: File, newOrder: PageOrder[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

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
