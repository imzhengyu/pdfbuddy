import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageOrder, ProcessingProgress } from '../services/pdf/types';

interface UseOrganizeResult {
  reorganize: (file: File, newOrder: PageOrder[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useOrganize(): UseOrganizeResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reorganize = useCallback(async (file: File, newOrder: PageOrder[]): Promise<Blob | null> => {
    if (!newOrder.length) {
      setError('Please select pages to reorganize');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: newOrder.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.reorganize(file, newOrder, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorganize PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { reorganize, isProcessing, progress, error, clearError };
}