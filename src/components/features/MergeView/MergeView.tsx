import { useState, useCallback, useEffect } from 'react';
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
import styles from './MergeView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function MergeView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();
  const { merge, isProcessing, progress, error, clearError } = useMerge();

  useEffect(() => {
    closePreview();
  }, [files, closePreview]);

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const newFiles = droppedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setIsAddingMore(false);
  }, []);

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
    if (files.length < 1) return;

    const fileList = files.map(f => f.file);
    const mergedBlob = await merge(fileList);

    if (mergedBlob) {
      const mergedFile = new File([mergedBlob], 'merged-preview.pdf', { type: 'application/pdf' });
      openPreview(mergedFile);
    }
  }, [files, merge, openPreview]);

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

          <div className={styles.actions}>
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
