import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useRotate } from '../../../hooks/useRotate';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageRotation, RotationType, MirrorType } from '../../../services/pdf/types';
import styles from './RotateView.module.css';

type TransformType = 'rotate' | 'mirror';

interface TransformOption {
  label: string;
  type: TransformType;
  degrees?: RotationType;
  mirror?: MirrorType;
}

const transformOptions: TransformOption[] = [
  { label: 'Rotate 90°', type: 'rotate', degrees: 90 },
  { label: 'Rotate 180°', type: 'rotate', degrees: 180 },
  { label: 'Rotate 270°', type: 'rotate', degrees: 270 },
  { label: 'Mirror H', type: 'mirror', mirror: 'horizontal' },
  { label: 'Mirror V', type: 'mirror', mirror: 'vertical' },
];

export function RotateView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { rotate, isProcessing, progress, error, clearError } = useRotate();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
      setResultFile(null);
    }
  }, []);

  const handlePageClick = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex) ? prev.filter(i => i !== pageIndex) : [...prev, pageIndex]
    );
  }, []);

  const handleTransform = useCallback(async (option: TransformOption) => {
    if (!file || selectedPages.length === 0) return;

    const rotations: PageRotation[] = selectedPages.map(pageIndex => ({
      pageIndex,
      type: option.type,
      degrees: option.degrees,
      mirror: option.mirror
    }));

    const result = await rotate(file, rotations);
    if (result) {
      const transformedFile = new File([result], `transformed_${file.name}`, { type: 'application/pdf' });
      setResultFile(transformedFile);
    }
  }, [file, selectedPages, rotate]);

  const handleDownload = useCallback(() => {
    if (!resultFile) return;
    downloadBlob(resultFile, `rotated_${file?.name || 'document.pdf'}`);
  }, [resultFile, file]);

  const handleClearSelection = useCallback(() => {
    setSelectedPages([]);
    setResultFile(null);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Rotate PDF</h2>
        <p className={styles.description}>
          Select pages and apply rotation or mirror transformations. Preview the result before downloading.
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to rotate"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button
              label="Change File"
              variant="outline"
              size="sm"
              onClick={() => { setFile(null); setSelectedPages([]); setResultFile(null); }}
            />
          </div>

          <div className={styles.splitContainer}>
            <div className={styles.sourceSection}>
              <h3 className={styles.sectionTitle}>Source Pages</h3>
              <p className={styles.sectionHint}>Click pages to select them</p>
              <PageThumbnails
                file={file}
                selectedPages={selectedPages}
                onPageClick={handlePageClick}
              />
              <p className={styles.selectionInfo}>
                {selectedPages.length === 0 ? 'No pages selected' : `${selectedPages.length} page(s) selected`}
              </p>
            </div>

            <div className={styles.targetSection}>
              <h3 className={styles.sectionTitle}>Result Preview</h3>
              <p className={styles.sectionHint}>
                {resultFile ? 'Transformed result' : 'Apply transformation to preview'}
              </p>
              <div className={`${styles.resultBox} ${!resultFile ? styles.empty : ''}`}>
                {resultFile ? (
                  <div className={styles.resultPreview}>
                    <PageThumbnails
                      file={resultFile}
                      onPageClick={() => {}}
                    />
                  </div>
                ) : (
                  <div className={styles.emptyResult}>
                    <span>Result will appear here</span>
                  </div>
                )}
              </div>
              {resultFile && (
                <div className={styles.resultActions}>
                  <Button
                    label="Download"
                    variant="primary"
                    onClick={handleDownload}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.transformButtons}>
            {transformOptions.map((option) => (
              <Button
                key={option.label}
                label={option.label}
                variant="outline"
                onClick={() => handleTransform(option)}
                disabled={selectedPages.length === 0 || isProcessing}
              />
            ))}
          </div>

          {selectedPages.length > 0 && (
            <div className={styles.actions}>
              <Button
                label="Clear Selection"
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              />
            </div>
          )}

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Preview Full"
              variant="outline"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!resultFile}
            />
          </div>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={resultFile}
        title="Preview - Transformed"
      />
    </div>
  );
}