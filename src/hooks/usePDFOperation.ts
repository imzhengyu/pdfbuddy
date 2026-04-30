import { useState, useCallback } from 'react';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { ProcessingProgress } from '../services/pdf/types';

export interface PDFOperationConfig<T> {
  validate: (params: T) => string | null;
  execute: (
    params: T,
    service: ClientPDFService,
    setProgress: (progress: ProcessingProgress) => void
  ) => Promise<any>;
  getProgressTotal: (params: T) => number;
}

export function usePDFOperation<T>(config: PDFOperationConfig<T>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const operation = useCallback(
    async (params: T): Promise<any> => {
      const validationError = config.validate(params);
      if (validationError) {
        setError(validationError);
        return null;
      }

      setIsProcessing(true);
      setError(null);
      const total = config.getProgressTotal(params);
      setProgress({ current: 0, total, percent: 0 });

      try {
        const service = new ClientPDFService();
        const result = await config.execute(params, service, setProgress);
        setProgress({ current: total, total, percent: 100 });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Operation failed';
        setError(message);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { operation, isProcessing, progress, error, clearError };
}
