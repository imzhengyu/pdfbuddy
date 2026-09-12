import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { FeatureViewShell } from '../../common/FeatureViewShell';
import { FileInfoHeader } from '../../common/FileInfoHeader';
import { ErrorBanner } from '../../common/ErrorBanner';
import { useOrganize } from '../../../hooks/useOrganize';
import { usePreview } from '../../../hooks/usePreview';
import { downloadBlob } from '../../../utils/downloadUtils';
import { getPageCount } from '../../../utils/fileUtils';
import { PageOrder } from '../../../services/pdf/types';
import { CONST_ERROR_MESSAGES, CONST_LIMITS_CONFIG } from '../../../config';
import shellStyles from '../../common/FeatureViewShell/FeatureViewShell.module.css';
import styles from './OrganizeView.module.css';

const USAGE_STEPS = [
  'Drop a PDF, or click to browse.',
  'Drag a page to move it where you want it.',
  'Click a page to mark it for deletion (click again to keep it).',
  'Download the organized PDF — the order and deletions you see are used.',
];

const LIMITS = [
  `Up to ${CONST_LIMITS_CONFIG.maxPagesPerDocument} pages per document`,
  'At least one page must remain',
];

/**
 * Moves `fromPage` to sit where `toPage` currently is.
 *
 * Both arguments are original page indices (what the thumbnail drag handlers
 * report), while `order` is indexed by on-screen position, so the positions have
 * to be looked up rather than used directly.
 *
 * @returns A new order array, or the original one when the move is a no-op
 */
export function movePage(order: number[], fromPage: number, toPage: number): number[] {
  const from = order.indexOf(fromPage);
  const to = order.indexOf(toPage);
  if (from === -1 || to === -1 || from === to) {
    return order;
  }

  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function OrganizeView() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { isPreviewOpen, previewFile, openPreview, closePreview } = usePreview();
  const { reorganize, isProcessing, progress, error, clearError } = useOrganize();

  const handleFileDropped = useCallback(async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setSelectedPages([]);
      setLoadError(null);
      try {
        const count = await getPageCount(f);
        setPageOrder(Array.from({ length: count }, (_, i) => i));
      } catch {
        setPageOrder([]);
        // Distinguish "the file could not be read" from "every page was
        // deleted": both used to surface as "No pages left after deletion".
        setLoadError(CONST_ERROR_MESSAGES.pageCountFailed(f.name));
      }
    }
  }, []);

  const handlePageSelect = useCallback((pageIndex: number) => {
    setSelectedPages(prev =>
      prev.includes(pageIndex) ? prev.filter(i => i !== pageIndex) : [...prev, pageIndex]
    );
  }, []);

  const handleOrganize = useCallback(async () => {
    if (!file || loadError) return;

    const deletedSet = new Set(selectedPages);
    const order: PageOrder[] = pageOrder
      .filter(idx => !deletedSet.has(idx))
      .map((originalIndex, newIndex) => ({ originalIndex, newIndex }));

    if (order.length === 0) {
      setWarning('No pages left after deletion');
      return;
    }
    const result = await reorganize(file, order);
    if (result) {
      downloadBlob(result, `organized_${file.name}`);
    }
  }, [file, loadError, pageOrder, selectedPages, reorganize]);

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
        return movePage(prev, dragIndex, dragOverIndex);
      });
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex]);

  const handleChangeFile = useCallback(() => {
    setFile(null);
    setSelectedPages([]);
    setPageOrder([]);
    setLoadError(null);
    closePreview();
  }, [closePreview]);

  return (
    <FeatureViewShell
      title="Organize PDF"
      description="Reorder and delete pages in your PDF."
      usage={USAGE_STEPS}
      limits={LIMITS}
      isEmpty={!file}
      emptyView={
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to organize"
          multiple={false}
        />
      }
      workspace={() => (
        <>
          <FileInfoHeader
            fileName={file!.name}
            onChangeFile={handleChangeFile}
          />

          <PageThumbnails
            file={file!}
            onSelect={handlePageSelect}
            selectedPages={selectedPages}
            order={pageOrder}
            onPageDragStart={handleDragStart}
            onPageDragOver={handleDragOver}
            onPageDragEnd={handleDragEnd}
            dragOverIndex={dragOverIndex}
          />

          <div className={shellStyles.actions}>
            <Button label="Preview PDF" variant="outline" onClick={() => openPreview(file!)} />
          </div>

          {selectedPages.length > 0 && (
            <p className={styles.hint}>{selectedPages.length} page(s) selected - they will be deleted</p>
          )}

          {isProcessing && progress && <ProgressBar progress={progress} />}

          <ErrorBanner message={error} onDismiss={clearError} />

          <ErrorBanner message={loadError} onDismiss={() => setLoadError(null)} />

          {warning && (
            <div className={styles.warning}>
              <span>{warning}</span>
              <button type="button" onClick={() => setWarning(null)}>×</button>
            </div>
          )}

          <div className={shellStyles.actions}>
            <Button label="Download Organized PDF" variant="primary" onClick={handleOrganize} disabled={isProcessing || !!loadError} loading={isProcessing} />
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
