import { useState, useCallback, useEffect, useRef } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { DraggableFileList } from '../../common/DraggableFileList';
import { FeatureViewShell } from '../../common/FeatureViewShell';
import { ErrorBanner } from '../../common/ErrorBanner';
import { useMerge } from '../../../hooks/useMerge';
import { usePreview } from '../../../hooks/usePreview';
import { downloadBlob } from '../../../utils/downloadUtils';
import { CONST_ERROR_MESSAGES, CONST_LIMITS_CONFIG } from '../../../config';
import shellStyles from '../../common/FeatureViewShell/FeatureViewShell.module.css';
import styles from './MergeView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function MergeView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [fileLimitError, setFileLimitError] = useState<string | null>(null);
  const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();
  const { merge, isProcessing, progress, error, clearError } = useMerge();

  // Keep the latest merge() without making it an effect dependency: the hook
  // returns a new function identity on every render, which would otherwise make
  // the preview-sync effect below re-run forever.
  const mergeRef = useRef(merge);
  mergeRef.current = merge;

  const filesSignature = files.map((item) => item.id).join('|');
  const previewSignatureRef = useRef<string | null>(null);

  const buildMergedPreview = useCallback(async (): Promise<File | null> => {
    if (files.length === 0) return null;

    const result = await mergeRef.current(files.map((item) => item.file));
    return result
      ? new File([result], 'merged-preview.pdf', { type: 'application/pdf' })
      : null;
  }, [files]);

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const newFiles = droppedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file
    }));
    const limit = CONST_LIMITS_CONFIG.maxFilesPerOperation;
    const combined = [...files, ...newFiles];

    if (combined.length > limit) {
      setFiles(combined.slice(0, limit));
      setFileLimitError(CONST_ERROR_MESSAGES.fileLimitExceeded(limit));
    } else {
      setFiles(combined);
      setFileLimitError(null);
    }
    setIsAddingMore(false);
  }, [files]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;

    const fileList = files.map(f => f.file);
    const result = await merge(fileList);

    if (result) {
      downloadBlob(result, 'merged.pdf');
    }
  }, [files, merge]);

  const handleClear = useCallback(() => {
    setFiles([]);
    clearError();
  }, [clearError]);

  const handlePreview = useCallback(async () => {
    if (files.length === 0) return;

    const merged = await buildMergedPreview();
    if (merged) {
      previewSignatureRef.current = filesSignature;
      openPreview(merged);
    }
  }, [buildMergedPreview, files.length, filesSignature, openPreview]);

  // The preview is the merged document, so reordering (or adding/removing) files
  // while it is open has to rebuild it. Closing the modal instead - the previous
  // behaviour - left the user looking at the old order.
  useEffect(() => {
    if (!isPreviewOpen) return;

    if (files.length === 0) {
      previewSignatureRef.current = null;
      closePreview();
      return;
    }

    if (previewSignatureRef.current === filesSignature) return;
    previewSignatureRef.current = filesSignature;

    let cancelled = false;
    void (async () => {
      const merged = await buildMergedPreview();
      if (!cancelled && merged) {
        openPreview(merged);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    buildMergedPreview,
    closePreview,
    files.length,
    filesSignature,
    isPreviewOpen,
    openPreview,
  ]);

  return (
    <FeatureViewShell
      title="Merge PDFs"
      description="Combine multiple PDF files into a single document. Drag to reorder files before merging."
      isEmpty={files.length === 0}
      emptyView={
        <DropZone
          onFilesDropped={handleFilesDropped}
          message="Drag and drop PDF files here to merge"
        />
      }
      workspace={() => (
        <>
          <div className={styles.fileList}>
            <DraggableFileList
              files={files}
              onReorder={handleReorder}
              onRemove={handleRemoveFile}
            />
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          <ErrorBanner message={error} onDismiss={clearError} />

          <ErrorBanner message={fileLimitError} onDismiss={() => setFileLimitError(null)} />

          <div className={shellStyles.actions}>
            {isAddingMore ? (
              <DropZone
                onFilesDropped={handleFilesDropped}
                message="Add more PDF files"
              />
            ) : (
              <Button
                label="Add More Files"
                variant="outline"
                onClick={() => setIsAddingMore(true)}
              />
            )}
            <Button
              label="Preview Files"
              variant="outline"
              onClick={handlePreview}
              disabled={isProcessing}
              loading={isProcessing}
            />
            <Button
              label="Clear All"
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing}
            />
            <Button
              label={`Merge ${files.length} Files`}
              variant="primary"
              onClick={handleMerge}
              disabled={files.length < 2 || isProcessing}
              loading={isProcessing}
            />
          </div>

          <PreviewModal
            isOpen={isPreviewOpen}
            onClose={closePreview}
            file={previewFile}
            title="Merged Preview"
          />
        </>
      )}
    />
  );
}
