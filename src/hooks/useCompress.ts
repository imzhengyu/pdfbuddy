import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { CompressionQuality, ProcessingProgress } from '../services/pdf/types';

interface UseCompressResult {
  compress: (file: File, quality: CompressionQuality) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useCompress(): UseCompressResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compress = useCallback(async (file: File, quality: CompressionQuality): Promise<Blob | null> => {
    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: 1, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.compress(file, quality, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compress PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { compress, isProcessing, progress, error, clearError };
}