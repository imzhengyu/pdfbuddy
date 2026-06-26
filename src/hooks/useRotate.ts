import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { PageRotation, ProcessingProgress } from '../services/pdf/types';

/**
 * Return type for the useRotate hook containing rotate function and operation state.
 */
interface UseRotateResult {
  /** Rotates specified pages in a PDF file by the given degrees. */
  rotate: (file: File, rotations: PageRotation[]) => Promise<Blob | null>;
  /** Whether a rotate operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for rotating pages within a PDF file.
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseRotateResult - Object containing rotate function and operation state
 *
 * @example
 * ```tsx
 * const { rotate, isProcessing, progress, error, clearError } = useRotate();
 *
 * const handleRotate = async () => {
 *   const result = await rotate(file, [{ pageIndex: 0, type: 'rotate', degrees: 90 }]);
 *   if (result) {
 *     // Download rotated PDF
 *   }
 * };
 * ```
 */
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
