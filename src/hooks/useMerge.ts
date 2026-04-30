import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { ProcessingProgress } from '../services/pdf/types';

interface UseMergeResult {
  merge: (files: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

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
