import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { ProcessingProgress } from '../services/pdf/types';

interface UseMergeResult {
  merge: (files: File[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useMerge(): UseMergeResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merge = useCallback(async (files: File[]): Promise<Blob | null> => {
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: files.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.merge(files, setProgress);
      setProgress({ current: files.length, total: files.length, percent: 100 });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to merge PDFs';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { merge, isProcessing, progress, error, clearError };
}