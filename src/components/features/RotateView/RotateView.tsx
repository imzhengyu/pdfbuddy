import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useRotate } from '../../../hooks/useRotate';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageRotation } from '../../../services/pdf/types';
import styles from './RotateView.module.css';

export function RotateView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { rotate, isProcessing, progress, error, clearError } = useRotate();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
    }
  }, []);

  const handlePageSelect = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex) ? prev.filter(i => i !== pageIndex) : [...prev, pageIndex]
    );
  }, []);

  const handleRotate = useCallback(async () => {
    if (!file || selectedPages.length === 0) return;
    const rotations: PageRotation[] = selectedPages.map(pageIndex => ({ pageIndex, degrees: 90 }));
    const result = await rotate(file, rotations);
    if (result) {
      downloadBlob(result, `rotated_${file.name}`);
    }
  }, [file, selectedPages, rotate]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Rotate PDF</h2>
        <p className={styles.description}>Click pages to select, then rotate them 90 degrees.</p>
      </div>

      {!file ? (
        <DropZone onFilesDropped={handleFileDropped} message="Drag and drop a PDF file to rotate" multiple={false} />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails file={file} onSelect={handlePageSelect} selectedPages={selectedPages} />

          <div className={styles.actions}>
            <Button label="Preview PDF" variant="outline" onClick={() => setIsPreviewOpen(true)} />
          </div>

          <p className={styles.hint}>
            {selectedPages.length === 0 ? 'Click pages to select them' : `${selectedPages.length} page(s) selected`}
          </p>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button label="Rotate 90°" variant="primary" onClick={handleRotate} disabled={selectedPages.length === 0 || isProcessing} loading={isProcessing} />
          </div>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={file}
        title="Preview"
      />
    </div>
  );
}