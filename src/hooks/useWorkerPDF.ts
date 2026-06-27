import { useState, useCallback, useRef, useEffect } from 'react';
import {
  WorkerRequest,
  WorkerOutgoingMessage,
  WorkerProgressMessage,
  WorkerSuccessMessage,
  WorkerErrorMessage,
  WorkerOperationType,
} from '../workers/workerTypes';
import { ProcessingProgress } from '../services/pdf/types';

export interface UseWorkerPDFOptions {
  onProgress?: (progress: ProcessingProgress) => void;
  onError?: (error: string) => void;
  onSuccess?: (result: unknown) => void;
}

export interface UseWorkerPDFReturn {
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  result: unknown | null;
  startOperation: (operation: WorkerOperationType, payload: unknown) => void;
  cancel: () => void;
  reset: () => void;
}

export function useWorkerPDF(options: UseWorkerPDFOptions = {}): UseWorkerPDFReturn {
  const { onProgress, onError, onSuccess } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const currentIdRef = useRef<string | null>(null);

  // Initialize worker once and reuse across operations
  const getWorker = useCallback(() => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = new Worker(
      new URL('../workers/pdfProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<WorkerOutgoingMessage>) => {
      const message = event.data;
      // Ignore messages from stale operations
      if (currentIdRef.current && message.id !== currentIdRef.current) {
        return;
      }

      switch (message.type) {
        case 'progress': {
          const progressMsg = message as WorkerProgressMessage;
          setProgress(progressMsg.progress);
          onProgress?.(progressMsg.progress);
          break;
        }
        case 'success': {
          const successMsg = message as WorkerSuccessMessage;
          setResult(successMsg.result);
          setIsProcessing(false);
          onSuccess?.(successMsg.result);
          break;
        }
        case 'error': {
          const errorMsg = message as WorkerErrorMessage;
          setError(errorMsg.error);
          setIsProcessing(false);
          onError?.(errorMsg.error);
          break;
        }
      }
    };

    worker.onerror = (err) => {
      setError(err.message || 'Worker error occurred');
      setIsProcessing(false);
      onError?.(err.message || 'Worker error occurred');
    };

    workerRef.current = worker;
    return worker;
  }, [onProgress, onError, onSuccess]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const startOperation = useCallback(
    (operation: WorkerOperationType, payload: unknown) => {
      const id = crypto.randomUUID();
      currentIdRef.current = id;

      setIsProcessing(true);
      setProgress(null);
      setError(null);
      setResult(null);

      const worker = getWorker();
      const request: WorkerRequest = { id, operation, payload };

      worker.postMessage(request);
    },
    [getWorker]
  );

  const cancel = useCallback(() => {
    if (workerRef.current && currentIdRef.current) {
      workerRef.current.postMessage({ type: 'cancel', id: currentIdRef.current });
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    currentIdRef.current = null;
    setIsProcessing(false);
    setProgress(null);
    setError(null);
    setResult(null);
  }, []);

  return {
    isProcessing,
    progress,
    error,
    result,
    startOperation,
    cancel,
    reset,
  };
}
