import { useState, useCallback } from 'react';

/**
 * Represents the state and handlers for PDF preview functionality.
 * Provides a centralized way to manage preview modal state across views.
 */
export interface UsePreviewResult {
  /** Whether the preview modal is currently open */
  isPreviewOpen: boolean;
  /** The file currently being previewed, or null if none */
  previewFile: File | null;
  /** Handler to open the preview modal with a specific file */
  openPreview: (file: File) => void;
  /** Handler to close the preview modal and clear the preview file */
  closePreview: () => void;
}

/**
 * Custom hook that manages PDF preview state and handlers.
 * Abstracts common preview logic used across multiple views.
 *
 * @returns UsePreviewResult - Object containing preview state and handlers
 *
 * @example
 * ```tsx
 * function MyView() {
 *   const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();
 *
 *   const handlePreview = () => {
 *     openPreview(myFile);
 *   };
 *
 *   return (
 *     <>
 *       <Button label="Preview" onClick={handlePreview} />
 *       <PreviewModal
 *         isOpen={isPreviewOpen}
 *         onClose={closePreview}
 *         file={previewFile}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function usePreview(): UsePreviewResult {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const openPreview = useCallback((file: File) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  }, []);

  return {
    isPreviewOpen,
    previewFile,
    openPreview,
    closePreview,
  };
}