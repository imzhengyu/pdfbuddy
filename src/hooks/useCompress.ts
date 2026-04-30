import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { CompressionQuality, ProcessingProgress } from '../services/pdf/types';

interface UseCompressResult {
  compress: (file: File, quality: CompressionQuality) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useCompress(): UseCompressResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    file: File;
    quality: CompressionQuality;
  }>({
    validate: () => null,
    execute: async ({ file, quality }, service, setProgress) => {
      return service.compress(file, quality, setProgress);
    },
    getProgressTotal: () => 1,
  });

  const compress = useCallback(
    async (file: File, quality: CompressionQuality) =>
      operation({ file, quality }),
    [operation]
  );

  return { compress, isProcessing, progress, error, clearError };
}
