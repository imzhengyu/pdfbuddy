import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { FeatureViewShell } from '../../common/FeatureViewShell';
import { FileInfoHeader } from '../../common/FileInfoHeader';
import { ErrorBanner } from '../../common/ErrorBanner';
import { useCompress } from '../../../hooks/useCompress';
import { usePreview } from '../../../hooks/usePreview';
import { downloadBlob } from '../../../utils/downloadUtils';
import { formatFileSize } from '../../../utils/fileUtils';
import { CompressionQuality } from '../../../services/pdf/types';
import styles from './CompressView.module.css';

export function CompressView() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const [compressionResult, setCompressionResult] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();
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

  const handleChangeFile = useCallback(() => {
    setFile(null);
    setCompressionResult(null);
    closePreview();
  }, [closePreview]);

  const qualityLabel: Record<CompressionQuality, string> = {
    low: 'Maximum compression',
    medium: 'Balanced',
    high: 'Best quality',
  };

  return (
    <FeatureViewShell
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality."
      isEmpty={!file}
      emptyView={
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to compress"
          multiple={false}
        />
      }
      workspace={() => (
        <>
          <FileInfoHeader
            fileName={file!.name}
            info={formatFileSize(file!.size)}
            onChangeFile={handleChangeFile}
            action={
              <Button
                label="Preview"
                variant="outline"
                size="sm"
                onClick={() => openPreview(file!)}
              />
            }
          />

          <div className={styles.qualityOptions}>
            {(['low', 'medium', 'high'] as CompressionQuality[]).map(q => (
              <label key={q} className={styles.qualityOption}>
                <input
                  type="radio"
                  name="quality"
                  value={q}
                  checked={quality === q}
                  onChange={() => setQuality(q)}
                />
                <span className={styles.qualityLabel}>
                  <strong>{q.charAt(0).toUpperCase() + q.slice(1)}</strong>
                  <small>{qualityLabel[q]}</small>
                </span>
              </label>
            ))}
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          <ErrorBanner message={error} onDismiss={clearError} />

          {compressionResult && (
            <div className={styles.success}>
              <span>Compressed! Size reduced by <strong>{compressionResult.reduction}%</strong> ({formatFileSize(compressionResult.originalSize)} → {formatFileSize(compressionResult.compressedSize)})</span>
              <button type="button" onClick={() => setCompressionResult(null)}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button label="Compress PDF" variant="primary" onClick={handleCompress} disabled={isProcessing} loading={isProcessing} />
          </div>

          <PreviewModal
            isOpen={isPreviewOpen}
            onClose={closePreview}
            file={previewFile}
            title="Preview"
          />
        </>
      )}
    />
  );
}
