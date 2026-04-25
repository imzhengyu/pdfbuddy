import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageRange, ProcessingProgress } from '../services/pdf/types';

interface UseSplitResult {
  split: (file: File, pageRanges: PageRange[]) => Promise<Blob[] | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useSplit(): UseSplitResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const split = useCallback(async (file: File, pageRanges: PageRange[]): Promise<Blob[] | null> => {
    if (!pageRanges.length) {
      setError('Please specify at least one page range to split');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: pageRanges.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.split(file, pageRanges, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to split PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { split, isProcessing, progress, error, clearError };
}