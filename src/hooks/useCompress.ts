import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { CompressionQuality, ProcessingProgress } from '../services/pdf/types';

/**
 * Return type for the useCompress hook containing compress function and operation state.
 */
interface UseCompressResult {
  /** Compresses a PDF file with the specified quality level. */
  compress: (file: File, quality: CompressionQuality) => Promise<Blob | null>;
  /** Whether a compression operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for compressing PDF files with configurable quality levels.
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseCompressResult - Object containing compress function and operation state
 *
 * @example
 * ```tsx
 * const { compress, isProcessing, progress, error, clearError } = useCompress();
 *
 * const handleCompress = async () => {
 *   const result = await compress(file, 'medium');
 *   if (result) {
 *     // Download compressed PDF
 *   }
 * };
 * ```
 */
export function useCompress(): UseCompressResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    file: File;
    quality: CompressionQuality;
  }>({
    validate: () => null,
    execute: async ({ file, quality }, service, setProgress) => {
      return service.compress(file, quality, setProgress);
    },
    getProgressTotal: () => 1,
  });

  const compress = useCallback(
    async (file: File, quality: CompressionQuality) =>
      operation({ file, quality }),
    [operation]
  );

  return { compress, isProcessing, progress, error, clearError };
}
