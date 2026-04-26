import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useMerge } from '../../../hooks/useMerge';
import { downloadBlob } from '../../../utils/downloadUtils';
import { formatFileSize } from '../../../utils/fileUtils';
import styles from './MergeView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function MergeView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { merge, isProcessing, progress, error, clearError } = useMerge();

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

    setIsPreviewLoading(true);
    const fileList = files.map(f => f.file);
    const mergedBlob = await merge(fileList);

    if (mergedBlob) {
      const mergedFile = new File([mergedBlob], 'merged-preview.pdf', { type: 'application/pdf' });
      setPreviewFile(mergedFile);
      setIsPreviewOpen(true);
    }
    setIsPreviewLoading(false);
  }, [files, merge]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setFiles(prev => {
        const newFiles = [...prev];
        const [removed] = newFiles.splice(dragIndex, 1);
        newFiles.splice(dragOverIndex, 0, removed);
        return newFiles;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Merge PDFs</h2>
        <p className={styles.description}>
          Combine multiple PDF files into a single document. Drag to reorder files before merging.
        </p>
      </div>

      {files.length === 0 ? (
        <DropZone
          onFilesDropped={handleFilesDropped}
          message="Drag and drop PDF files here to merge"
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileList}>
            {files.map((fileItem, index) => (
              <div
                key={fileItem.id}
                className={`${styles.fileItem} ${dragIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className={styles.dragHandle}>⋮⋮</span>
                <span className={styles.index}>{index + 1}</span>
                <span className={styles.name}>{fileItem.file.name}</span>
                <span className={styles.size}>{formatFileSize(fileItem.file.size)}</span>
                <Button
                  label="Remove"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFile(fileItem.id)}
                />
              </div>
            ))}
          </div>

          {isProcessing && progress && (
            <ProgressBar progress={progress} />
          )}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError} className={styles.errorClose}>×</button>
            </div>
          )}

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
              disabled={isPreviewLoading}
              loading={isPreviewLoading}
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
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewFile(null);
        }}
        file={previewFile}
        title="Merged Preview"
      />
    </div>
  );
}