import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageRotation, ProcessingProgress } from '../services/pdf/types';

interface UseRotateResult {
  rotate: (file: File, rotations: PageRotation[]) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

export function useRotate(): UseRotateResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    file: File;
    rotations: PageRotation[];
  }>({
    validate: ({ rotations }) => {
      if (!rotations.length) {
        return 'Please select at least one page to rotate';
      }
      return null;
    },
    execute: async ({ file, rotations }, service, setProgress) => {
      return service.rotate(file, rotations, setProgress);
    },
    getProgressTotal: ({ rotations }) => rotations.length,
  });

  const rotate = useCallback(
    async (file: File, rotations: PageRotation[]) =>
      operation({ file, rotations }),
    [operation]
  );

  return { rotate, isProcessing, progress, error, clearError };
}
