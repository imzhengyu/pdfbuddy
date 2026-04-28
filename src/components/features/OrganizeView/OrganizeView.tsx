import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useOrganize } from '../../../hooks/useOrganize';
import { downloadBlob } from '../../../utils/downloadUtils';
import { getPageCount } from '../../../utils/fileUtils';
import { PageOrder } from '../../../services/pdf/types';
import styles from './OrganizeView.module.css';

export function OrganizeView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { reorganize, isProcessing, progress, error, clearError } = useOrganize();

  const handleFileDropped = useCallback(async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setSelectedPages([]);
      try {
        const count = await getPageCount(f);
        setPageOrder(Array.from({ length: count }, (_, i) => i));
      } catch {
        setPageOrder([]);
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

    // Build PageOrder from the current pageOrder array, excluding deleted pages
    const deletedSet = new Set(selectedPages);
    const order: PageOrder[] = pageOrder
      .filter(idx => !deletedSet.has(idx))
      .map((originalIndex, newIndex) => ({ originalIndex, newIndex }));

    if (order.length === 0) {
      alert('No pages left after deletion');
      return;
    }
    const result = await reorganize(file, order);
    if (result) {
      downloadBlob(result, `organized_${file.name}`);
    }
  }, [file, pageOrder, selectedPages, reorganize]);

  const handleDragStart = useCallback((_e: React.DragEvent, pageIndex: number) => {
    setDragIndex(pageIndex);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== pageIndex) {
      setDragOverIndex(pageIndex);
    }
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      setPageOrder(prev => {
        const newOrder = [...prev];
        const [removed] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dragOverIndex, 0, removed);
        return newOrder;
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex]);

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

          <PageThumbnails
            file={file}
            onSelect={handlePageSelect}
            selectedPages={selectedPages}
            onPageDragStart={handleDragStart}
            onPageDragOver={handleDragOver}
            onPageDragEnd={handleDragEnd}
            dragOverIndex={dragOverIndex}
          />

          <div className={styles.actions}>
            <Button label="Preview PDF" variant="outline" onClick={() => setIsPreviewOpen(true)} />
          </div>

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

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={file}
        title="Preview"
      />
    </div>
  );
}