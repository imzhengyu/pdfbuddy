import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { useOrganize } from '../../../hooks/useOrganize';
import { downloadBlob } from '../../../utils/downloadUtils';
import { getPageCount } from '../../../utils/fileUtils';
import { PageOrder } from '../../../services/pdf/types';
import styles from './OrganizeView.module.css';

export function OrganizeView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageCount, setPageCount] = useState<number>(0);
  const { reorganize, isProcessing, progress, error, clearError } = useOrganize();

  const handleFileDropped = useCallback(async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setSelectedPages([]);
      try {
        const count = await getPageCount(f);
        setPageCount(count);
      } catch {
        setPageCount(0);
      }
    }
  }, []);

  const handlePageSelect = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex) ? prev.filter(i => i !== pageIndex) : [...prev, pageIndex]
    );
  }, []);

  const handleOrganize = useCallback(async () => {
    if (!file) return;
    const order: PageOrder[] = Array.from({ length: pageCount }, (_, i) => ({
      originalIndex: i,
      newIndex: selectedPages.includes(i) ? -1 : i
    })).filter(o => o.newIndex !== -1).map((o, i) => ({ originalIndex: o.originalIndex, newIndex: i }));

    if (order.length === 0) {
      alert('No pages left after deletion');
      return;
    }
    const result = await reorganize(file, order);
    if (result) {
      downloadBlob(result, `organized_${file.name}`);
    }
  }, [file, pageCount, selectedPages, reorganize]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Organize PDF</h2>
        <p className={styles.description}>Reorder and delete pages in your PDF.</p>
      </div>

      {!file ? (
        <DropZone onFilesDropped={handleFileDropped} message="Drag and drop a PDF file to organize" multiple={false} />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => setFile(null)} />
          </div>

          <PageThumbnails file={file} onSelect={handlePageSelect} selectedPages={selectedPages} />

          {selectedPages.length > 0 && (
            <p className={styles.hint}>{selectedPages.length} page(s) selected - they will be deleted</p>
          )}

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button label="Download Organized PDF" variant="primary" onClick={handleOrganize} disabled={isProcessing} loading={isProcessing} />
          </div>
        </div>
      )}
    </div>
  );
}