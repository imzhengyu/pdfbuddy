import { useState, useCallback, useMemo } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useRotate } from '../../../hooks/useRotate';
import { downloadBlob } from '../../../utils/downloadUtils';
import { PageRotation, RotationType } from '../../../services/pdf/types';
import styles from './RotateView.module.css';

export function RotateView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [resultFile, setResultFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Track rotation angle (0, 90, 180, 270) for each page
  const [pageRotations, setPageRotations] = useState<Map<number, number>>(new Map());
  const { rotate, isProcessing, progress, error, clearError } = useRotate();

  const handleFileDropped = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setSelectedPages([]);
      setResultFile(null);
      setPageRotations(new Map());
    }
  }, []);

  const handlePageClick = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex) ? prev.filter(i => i !== pageIndex) : [...prev, pageIndex]
    );
  }, []);

  const handleRotate = useCallback((pageIndex: number) => {
    setPageRotations(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(pageIndex) || 0;
      newMap.set(pageIndex, (current + 90) % 360);
      return newMap;
    });
    // Generate result preview when rotation changes
    setResultFile(null);
  }, []);

  const handleApplyRotation = useCallback(async () => {
    if (!file) return;

    // Build rotations array from pageRotations map
    const rotations: PageRotation[] = [];
    pageRotations.forEach((degrees, pageIndex) => {
      if (degrees > 0) {
        rotations.push({ pageIndex, type: 'rotate', degrees: degrees as RotationType });
      }
    });

    if (rotations.length === 0) {
      return;
    }

    const result = await rotate(file, rotations);
    if (result) {
      const transformedFile = new File([result], `rotated_${file.name}`, { type: 'application/pdf' });
      setResultFile(transformedFile);
    }
  }, [file, pageRotations, rotate]);

  const handleDownload = useCallback(() => {
    if (!resultFile) return;
    downloadBlob(resultFile, `rotated_${file?.name || 'document.pdf'}`);
  }, [resultFile, file]);

  const handleClearSelection = useCallback(() => {
    setSelectedPages([]);
    setPageRotations(new Map());
    setResultFile(null);
  }, []);

  const handleChangeFile = useCallback(() => {
    setFile(null);
    setSelectedPages([]);
    setResultFile(null);
    setPageRotations(new Map());
  }, []);

  const hasRotations = useMemo(() => {
    for (const deg of pageRotations.values()) {
      if (deg > 0) return true;
    }
    return false;
  }, [pageRotations]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Rotate PDF</h2>
        <p className={styles.description}>
          Click the rotate button on any page to rotate it 90°. Preview and download when done.
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
              onClick={handleChangeFile}
            />
          </div>

          <div className={styles.splitContainer}>
            <div className={styles.sourceSection}>
              <h3 className={styles.sectionTitle}>Source Pages</h3>
              <p className={styles.sectionHint}>Click pages to select, hover to rotate</p>
              <PageThumbnails
                file={file}
                selectedPages={selectedPages}
                onPageClick={handlePageClick}
                onRotate={handleRotate}
              />
              <p className={styles.selectionInfo}>
                {selectedPages.length === 0 ? 'No pages selected' : `${selectedPages.length} page(s) selected`}
              </p>
            </div>

            <div className={styles.targetSection}>
              <h3 className={styles.sectionTitle}>Result Preview</h3>
              <p className={styles.sectionHint}>
                {resultFile ? 'Ready to download' : 'Apply rotation to see preview'}
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

          <div className={styles.actions}>
            <Button
              label="Apply Rotation"
              variant="primary"
              onClick={handleApplyRotation}
              disabled={!hasRotations || isProcessing}
            />
            <Button
              label="Preview"
              variant="outline"
              onClick={() => setIsPreviewOpen(true)}
              disabled={!resultFile}
            />
            <Button
              label="Clear"
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={!hasRotations && selectedPages.length === 0}
            />
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={resultFile}
        title="Preview - Rotated"
      />
    </div>
  );
}