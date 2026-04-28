import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useCompress } from '../../../hooks/useCompress';
import { downloadBlob } from '../../../utils/downloadUtils';
import { formatFileSize } from '../../../utils/fileUtils';
import { CompressionQuality } from '../../../services/pdf/types';
import styles from './CompressView.module.css';

export function CompressView() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [compressionResult, setCompressionResult] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const { compress, isProcessing, progress, error, clearError } = useCompress();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;

    const result = await compress(file, quality);
    if (result) {
      const originalSize = file.size;
      const compressedSize = result.size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);
      setCompressionResult({ originalSize, compressedSize, reduction });
      downloadBlob(result, `compressed_${file.name}`);
    }
  }, [file, quality, compress]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Compress PDF</h2>
        <p className={styles.description}>Reduce PDF file size while maintaining quality.</p>
      </div>

      {!file ? (
        <DropZone onFilesDropped={handleFileDropped} message="Drag and drop a PDF file to compress" multiple={false} />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong> ({formatFileSize(file.size)})</span>
            <Button label="Preview" variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} />
          </div>

          <div className={styles.qualityOptions}>
            {(['low', 'medium', 'high'] as CompressionQuality[]).map(q => (
              <label key={q} className={styles.qualityOption}>
                <input type="radio" name="quality" value={q} checked={quality === q} onChange={() => setQuality(q)} />
                <span className={styles.qualityLabel}>
                  <strong>{q.charAt(0).toUpperCase() + q.slice(1)}</strong>
                  <small>{q === 'low' && 'Maximum compression'}{q === 'medium' && 'Balanced'}{q === 'high' && 'Best quality'}</small>
                </span>
              </label>
            ))}
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          {compressionResult && (
            <div className={styles.success}>
              <span>Compressed! Size reduced by <strong>{compressionResult.reduction}%</strong> ({formatFileSize(compressionResult.originalSize)} → {formatFileSize(compressionResult.compressedSize)})</span>
              <button onClick={() => setCompressionResult(null)}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button label="Compress PDF" variant="primary" onClick={handleCompress} disabled={isProcessing} loading={isProcessing} />
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