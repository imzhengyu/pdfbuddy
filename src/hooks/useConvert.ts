import { useCallback } from 'react';
import { usePDFOperation } from './usePDFOperation';
import { ProcessingProgress } from '../services/pdf/types';
import { ConvertToPDFOptions } from '../services/pdf/convertOperation';

/**
 * Return type for the useConvert hook containing convertToPDF function and operation state.
 */
interface UseConvertResult {
  /** Converts image files into a single PDF document. */
  convertToPDF: (imageFiles: File[], options?: ConvertToPDFOptions) => Promise<Blob | null>;
  /** Whether a conversion operation is currently in progress. */
  isProcessing: boolean;
  /** Current progress information for the operation. */
  progress: ProcessingProgress | null;
  /** Error message if the last operation failed, null otherwise. */
  error: string | null;
  /** Clears the current error state. */
  clearError: () => void;
}

/**
 * Custom hook for converting image files (JPEG, PNG, etc.) into a PDF document.
 * Uses usePDFOperation internally to handle validation, progress tracking, and error handling.
 *
 * @returns UseConvertResult - Object containing convertToPDF function and operation state
 *
 * @example
 * ```tsx
 * const { convertToPDF, isProcessing, progress, error, clearError } = useConvert();
 *
 * const handleConvert = async () => {
 *   const result = await convertToPDF(imageFiles, { pageSize: 'a4', fitMode: 'fit' });
 *   if (result) {
 *     // Download created PDF
 *   }
 * };
 * ```
 */
export function useConvert(): UseConvertResult {
  const { operation, isProcessing, progress, error, clearError } = usePDFOperation<{
    files: File[];
    options?: ConvertToPDFOptions;
  }>({
    validate: ({ files }) => {
      if (!files.length) {
        return 'Please select at least one image to convert';
      }
      return null;
    },
    execute: async ({ files, options }, service, setProgress) => {
      return service.convertToPDF(files, setProgress, options);
    },
    getProgressTotal: ({ files }) => files.length,
  });

  const convertToPDF = useCallback(
    async (imageFiles: File[], options?: ConvertToPDFOptions) =>
      operation({ files: imageFiles, options }),
    [operation]
  );

  return { convertToPDF, isProcessing, progress, error, clearError };
}
