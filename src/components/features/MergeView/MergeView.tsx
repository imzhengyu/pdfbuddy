import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { FileList } from '../../common/FileList/FileList';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useMerge } from '../../../hooks/useMerge';
import { downloadBlob } from '../../../utils/downloadUtils';
import styles from './MergeView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function MergeView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
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
          <FileList
            files={files}
            onRemove={handleRemoveFile}
            showPageCount={false}
          />

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
    </div>
  );
}