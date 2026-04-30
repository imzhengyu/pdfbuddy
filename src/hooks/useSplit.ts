import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageRange, ProcessingProgress } from '../services/pdf/types';

interface UseSplitResult {
  split: (file: File, pageRanges: PageRange[]) => Promise<Blob[] | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

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
