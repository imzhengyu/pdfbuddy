import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { ProcessingProgress } from '../services/pdf/types';

interface UseConvertResult {
  convertToPDF: (imageFiles: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useConvert(): UseConvertResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertToPDF = useCallback(async (imageFiles: File[]): Promise<Blob | null> => {
    if (!imageFiles.length) {
      setError('Please select at least one image to convert');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: imageFiles.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.convertToPDF(imageFiles, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to convert images to PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { convertToPDF, isProcessing, progress, error, clearError };
}