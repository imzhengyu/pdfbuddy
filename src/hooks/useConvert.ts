import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { ProcessingProgress } from '../services/pdf/types';

interface UseConvertResult {
  convertToPDF: (imageFiles: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useConvert(): UseConvertResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<File[]>({
    validate: (imageFiles) => {
      if (!imageFiles.length) {
        return 'Please select at least one image to convert';
      }
      return null;
    },
    execute: async (imageFiles, service, setProgress) => {
      return service.convertToPDF(imageFiles, setProgress);
    },
    getProgressTotal: (imageFiles) => imageFiles.length,
  });

  const convertToPDF = useCallback(
    async (imageFiles: File[]) => operation(imageFiles),
    [operation]
  );

  return { convertToPDF, isProcessing, progress, error, clearError };
}
