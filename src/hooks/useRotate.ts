import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageRotation, ProcessingProgress } from '../services/pdf/types';

interface UseRotateResult {
  rotate: (file: File, rotations: PageRotation[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useRotate(): UseRotateResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rotate = useCallback(async (file: File, rotations: PageRotation[]): Promise<Blob | null> => {
    if (!rotations.length) {
      setError('Please select at least one page to rotate');
      return null;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: rotations.length, percent: 0 });

    try {
      const service = new ClientPDFService();
      const result = await service.rotate(file, rotations, setProgress);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rotate PDF';
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { rotate, isProcessing, progress, error, clearError };
}