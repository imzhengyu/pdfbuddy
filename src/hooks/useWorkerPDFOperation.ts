import { useState, useCallback } from 'react';
import { useWorkerPDF, UseWorkerPDFOptions } from './useWorkerPDF';
import { ClientPDFService } from '../services/pdf/ClientPDFService';
import { PageRange } from '../services/pdf/types';
import { ConvertToPDFOptions } from '../services/pdf/convertOperation';

export interface UseWorkerPDFOperationOptions extends UseWorkerPDFOptions {
  /** Set to true to use worker, false to use main thread */
  useWorker?: boolean;
}

export interface UseWorkerPDFOperationReturn {
  isProcessing: boolean;
  progress: { current: number; total: number; percent: number } | null;
  error: string | null;
  result: unknown | null;
  startMerge: (files: File[]) => void;
  startSplit: (file: File, pageRanges: PageRange[]) => void;
  startConvertToPDF: (files: File[], options?: ConvertToPDFOptions) => void;
  cancel: () => void;
  reset: () => void;
}

export function useWorkerPDFOperation(
  options: UseWorkerPDFOperationOptions = {}
): UseWorkerPDFOperationReturn {
  const { useWorker = true, onProgress, onError, onSuccess } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  const mainThreadServiceRef = { current: new ClientPDFService() };

  const workerAPI = useWorkerPDF({
    onProgress: (p) => {
      setProgress(p);
      onProgress?.(p);
    },
    onError: (e) => {
      setError(e);
      onError?.(e);
    },
    onSuccess: (r) => {
      setResult(r);
      setIsProcessing(false);
      onSuccess?.(r);
    },
  });

  const startMerge = useCallback(
    (files: File[]) => {
      if (!useWorker) {
        setIsProcessing(true);
        setProgress(null);
        setError(null);
        setResult(null);

        mainThreadServiceRef.current
          .merge(files, (p) => {
            setProgress(p);
            onProgress?.(p);
          })
          .then((r) => {
            setResult(r);
            setIsProcessing(false);
            onSuccess?.(r);
          })
          .catch((err) => {
            setError(err.message);
            setIsProcessing(false);
            onError?.(err.message);
          });
        return;
      }

      setIsProcessing(true);
      setProgress(null);
      setError(null);
      setResult(null);
      workerAPI.startOperation('merge', { files });
    },
    [useWorker, onProgress, onError, onSuccess, workerAPI]
  );

  const startSplit = useCallback(
    (file: File, pageRanges: PageRange[]) => {
      if (!useWorker) {
        setIsProcessing(true);
        setProgress(null);
        setError(null);
        setResult(null);

        mainThreadServiceRef.current
          .split(file, pageRanges, (p) => {
            setProgress(p);
            onProgress?.(p);
          })
          .then((r) => {
            setResult(r);
            setIsProcessing(false);
            onSuccess?.(r);
          })
          .catch((err) => {
            setError(err.message);
            setIsProcessing(false);
            onError?.(err.message);
          });
        return;
      }

      setIsProcessing(true);
      setProgress(null);
      setError(null);
      setResult(null);
      workerAPI.startOperation('split', { file, pageRanges });
    },
    [useWorker, onProgress, onError, onSuccess, workerAPI]
  );

  const startConvertToPDF = useCallback(
    (files: File[], convertOptions?: ConvertToPDFOptions) => {
      if (!useWorker) {
        setIsProcessing(true);
        setProgress(null);
        setError(null);
        setResult(null);

        mainThreadServiceRef.current
          .convertToPDF(
            files,
            (p) => {
              setProgress(p);
              onProgress?.(p);
            },
            convertOptions
          )
          .then((r) => {
            setResult(r);
            setIsProcessing(false);
            onSuccess?.(r);
          })
          .catch((err) => {
            setError(err.message);
            setIsProcessing(false);
            onError?.(err.message);
          });
        return;
      }

      setIsProcessing(true);
      setProgress(null);
      setError(null);
      setResult(null);
      workerAPI.startOperation('convert', { files, options: convertOptions });
    },
    [useWorker, onProgress, onError, onSuccess, workerAPI]
  );

  const cancel = useCallback(() => {
    if (!useWorker) {
      // For main thread, there's no clean cancellation
      setIsProcessing(false);
      return;
    }
    workerAPI.cancel();
  }, [useWorker, workerAPI]);

  const reset = useCallback(() => {
    if (!useWorker) {
      setIsProcessing(false);
      setProgress(null);
      setError(null);
      setResult(null);
      return;
    }
    workerAPI.reset();
  }, [useWorker, workerAPI]);

  return {
    isProcessing: useWorker ? workerAPI.isProcessing : isProcessing,
    progress: useWorker ? workerAPI.progress : progress,
    error: useWorker ? workerAPI.error : error,
    result: useWorker ? workerAPI.result : result,
    startMerge,
    startSplit,
    startConvertToPDF,
    cancel,
    reset,
  };
}
