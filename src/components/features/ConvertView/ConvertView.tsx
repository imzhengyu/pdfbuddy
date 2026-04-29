import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { FileList } from '../../common/FileList/FileList';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useConvert } from '../../../hooks/useConvert';
import { downloadBlob } from '../../../utils/downloadUtils';
import { validateImageFile } from '../../../utils/fileUtils';
import styles from './ConvertView.module.css';

interface FileItem {
  id: string;
  file: File;
}

export function ConvertView() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { convertToPDF, isProcessing, progress, error, clearError } = useConvert();

  const handleFilesDropped = useCallback((droppedFiles: File[]) => {
    const validFiles = droppedFiles.filter(validateImageFile);
    const newFiles = validFiles.map((file, index) => ({ id: `${Date.now()}-${index}`, file }));
    setFiles(prev => [...prev, ...newFiles]);
    setIsAddingMore(false);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    const fileList = files.map(f => f.file);
    const result = await convertToPDF(fileList);
    if (result) {
      downloadBlob(result, 'converted.pdf');
    }
  }, [files, convertToPDF]);

  const handlePreview = useCallback(async () => {
    if (files.length === 0) return;
    setIsPreviewLoading(true);
    const fileList = files.map(f => f.file);
    const result = await convertToPDF(fileList);
    if (result) {
      const convertedFile = new File([result], 'converted-preview.pdf', { type: 'application/pdf' });
      setPreviewFile(convertedFile);
      setIsPreviewOpen(true);
    }
    setIsPreviewLoading(false);
  }, [files, convertToPDF]);

  const handleClear = useCallback(() => {
    setFiles([]);
    setPreviewFile(null);
    clearError();
  }, [clearError]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Convert to PDF</h2>
        <p className={styles.description}>Convert images (PNG, JPEG) to a PDF document. Default page size: A4.</p>
      </div>

      {files.length === 0 ? (
        <DropZone onFilesDropped={handleFilesDropped} message="Drag and drop images here to convert to PDF" accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }} />
      ) : (
        <div className={styles.workspace}>
          <FileList files={files} onRemove={handleRemoveFile} showPageCount={false} />

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            {isAddingMore ? (
              <DropZone
                onFilesDropped={handleFilesDropped}
                message="Add more images"
                accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }}
              />
            ) : (
              <Button
                label="Add More"
                variant="outline"
                onClick={() => setIsAddingMore(true)}
                disabled={isProcessing}
              />
            )}
            <Button label="Clear All" variant="outline" onClick={handleClear} disabled={isProcessing} />
            <Button label="Preview PDF" variant="outline" onClick={handlePreview} disabled={isProcessing || files.length === 0} loading={isPreviewLoading} />
            <Button label={`Convert ${files.length} Image${files.length > 1 ? 's' : ''} to PDF`} variant="primary" onClick={handleConvert} disabled={isProcessing} loading={isProcessing} />
          </div>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        title="Preview - Converted PDF"
      />
    </div>
  );
}