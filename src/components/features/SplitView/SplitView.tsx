import { useState, useCallback } from 'react';
import { DropZone } from '../../common/DropZone/DropZone';
import { Button } from '../../common/Button/Button';
import { ProgressBar } from '../../common/ProgressBar/ProgressBar';
import { PageThumbnails } from '../../common/PageThumbnails/PageThumbnails';
import { PreviewModal } from '../../common/PreviewModal/PreviewModal';
import { useSplit } from '../../../hooks/useSplit';
import { downloadBlob } from '../../../utils/downloadUtils';
import { ClientPDFService } from '../../../services/pdf/ClientPDFService';
import { PageRange } from '../../../services/pdf/types';
import { getPageCount } from '../../../utils/fileUtils';
import styles from './SplitView.module.css';

type SelectionMode = 'visual' | 'range';

export function SplitView() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageRanges, setPageRanges] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('visual');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { split, isProcessing, progress, error, clearError } = useSplit();

  const handleFileDropped = useCallback(async (files: File[]) => {
    if (files.length > 0) {
      const f = files[0];
      setFile(f);
      setSelectedPages([]);
      setPageRanges('');
      setPreviewFile(null);
      try {
        const count = await getPageCount(f);
        setPageCount(count);
      } catch {
        setPageCount(0);
      }
    }
  }, []);

  const handlePageDrop = useCallback((pageIndex: number) => {
    setSelectedPages(prev => {
      if (prev.includes(pageIndex)) {
        return prev.filter(p => p !== pageIndex);
      }
      return [...prev, pageIndex].sort((a, b) => a - b);
    });
  }, []);

  const handlePageRemove = useCallback((pageIndex: number) => {
    setSelectedPages(prev => prev.filter(p => p !== pageIndex));
  }, []);

  const handleClearSelected = useCallback(() => {
    setSelectedPages([]);
  }, []);

  const handlePreview = useCallback(async () => {
    if (!file) return;

    let pagesToPreview: number[];
    if (selectionMode === 'range' && pageRanges.trim()) {
      pagesToPreview = parsePageRanges(pageRanges, pageCount);
    } else if (selectedPages.length > 0) {
      // selectedPages is 0-based, convert to 1-based for split
      pagesToPreview = selectedPages.map(p => p + 1);
    } else {
      return;
    }

    try {
      const service = new ClientPDFService();
      const ranges = pagesToPreview.map(page => ({ start: page, end: page }));
      const result = await service.split(file, ranges);

      if (result && result.length > 0) {
        let previewBlob: Blob;
        if (result.length === 1) {
          previewBlob = result[0];
        } else {
          // Merge all split pages into a single PDF for preview
          const files = result.map((blob, i) => new File([blob], `page_${i}.pdf`, { type: 'application/pdf' }));
          previewBlob = await service.merge(files);
        }
        const previewFileObj = new File([previewBlob], 'split-preview.pdf', { type: 'application/pdf' });
        setPreviewFile(previewFileObj);
        setIsPreviewOpen(true);
      }
    } catch (err) {
      console.error('Preview failed:', err);
    }
  }, [file, selectedPages, pageRanges, selectionMode, pageCount]);

  const parsePageRanges = (input: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = input.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= Math.min(end, maxPages); i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= maxPages && !pages.includes(num)) {
          pages.push(num);
        }
      }
    }
    return pages.sort((a, b) => a - b);
  };

  const handleExport = useCallback(async () => {
    if (!file) return;

    let pagesToExport: number[];
    if (selectionMode === 'range' && pageRanges.trim()) {
      pagesToExport = parsePageRanges(pageRanges, pageCount);
    } else if (selectedPages.length > 0) {
      // selectedPages is 0-based, convert to 1-based for split
      pagesToExport = selectedPages.map(p => p + 1);
    } else {
      return;
    }

    const ranges: PageRange[] = pagesToExport.map(page => ({ start: page, end: page }));
    const results = await split(file, ranges);

    if (results && results.length > 0) {
      const baseName = file.name.replace('.pdf', '');
      if (results.length === 1) {
        downloadBlob(results[0], `${baseName}_selected.pdf`);
      } else {
        const zipBlobs = results.map((blob, i) => ({ name: `page_${pagesToExport[i]}.pdf`, blob }));
        const { downloadBlobsAsZip } = await import('../../../utils/downloadUtils');
        await downloadBlobsAsZip(zipBlobs, `${baseName}_selected.zip`);
      }
    }
  }, [file, selectedPages, pageRanges, selectionMode, split, pageCount]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDropOnTarget = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const pageIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(pageIndex)) {
      handlePageDrop(pageIndex);
    }
  }, [handlePageDrop]);

  const handlePageDragStart = useCallback((e: React.DragEvent, pageIndex: number) => {
    e.dataTransfer.setData('text/plain', pageIndex.toString());
  }, []);

  const handlePageClick = useCallback((pageIndex: number) => {
    handlePageDrop(pageIndex);
  }, [handlePageDrop]);

  const hasSelection = selectionMode === 'visual'
    ? selectedPages.length > 0
    : pageRanges.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Split PDF</h2>
        <p className={styles.description}>
          Select pages to export using visual selection or page ranges. Preview shows the result after split.
        </p>
      </div>

      {!file ? (
        <DropZone
          onFilesDropped={handleFileDropped}
          message="Drag and drop a PDF file to split"
          multiple={false}
        />
      ) : (
        <div className={styles.workspace}>
          <div className={styles.fileInfo}>
            <span><strong>{file.name}</strong></span>
            <Button label="Change File" variant="outline" size="sm" onClick={() => { setFile(null); setSelectedPages([]); setPageRanges(''); setPreviewFile(null); }} />
          </div>

          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${selectionMode === 'visual' ? styles.active : ''}`}
              onClick={() => setSelectionMode('visual')}
              type="button"
            >
              Visual Selection
            </button>
            <button
              className={`${styles.modeBtn} ${selectionMode === 'range' ? styles.active : ''}`}
              onClick={() => setSelectionMode('range')}
              type="button"
            >
              Page Ranges
            </button>
          </div>

          {selectionMode === 'visual' ? (
            <div className={styles.splitContainer}>
              <div className={styles.sourceSection}>
                <h3 className={styles.sectionTitle}>Source Pages</h3>
                <p className={styles.sectionHint}>Click pages to select them</p>
                <div className={styles.sourceContent}>
                  <PageThumbnails
                    file={file}
                    selectedPages={selectedPages}
                    onPageClick={handlePageClick}
                    onPageDragStart={handlePageDragStart}
                  />
                </div>
              </div>

              <div className={styles.targetSection}>
                <h3 className={styles.sectionTitle}>Selected Pages</h3>
                <p className={styles.sectionHint}>Pages to export ({selectedPages.length} selected)</p>
                <div
                  className={`${styles.targetBox} ${isDraggingOver ? styles.dragOver : ''} ${selectedPages.length === 0 ? styles.empty : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropOnTarget}
                >
                  {selectedPages.length === 0 ? (
                    <div className={styles.emptyTarget}>
                      <span>Drag pages here or click to select</span>
                    </div>
                  ) : (
                    <div className={styles.selectedPages}>
                      {selectedPages.map((pageIndex, idx) => (
                        <div
                          key={pageIndex}
                          className={styles.selectedPageItem}
                          draggable
                          onDragStart={(e) => handlePageDragStart(e, pageIndex)}
                        >
                          <span className={styles.pageIndex}>{idx + 1}</span>
                          <span className={styles.pageLabel}>Page {pageIndex + 1}</span>
                          <button
                            className={styles.removeBtn}
                            onClick={() => handlePageRemove(pageIndex)}
                            type="button"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPages.length > 0 && (
                  <Button
                    label="Clear All"
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelected}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className={styles.rangeSection}>
              <div className={styles.inputGroup}>
                <label htmlFor="pageRanges">Page Ranges:</label>
                <input
                  id="pageRanges"
                  type="text"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                  placeholder="e.g., 1-3, 4-6, 7"
                  className={styles.input}
                />
                <p className={styles.rangeHint}>Enter page numbers or ranges separated by commas (max: {pageCount})</p>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Preview Selected"
              variant="outline"
              onClick={handlePreview}
              disabled={!hasSelection || isProcessing}
            />
          </div>

          {isProcessing && progress && <ProgressBar progress={progress} />}

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button onClick={clearError}>×</button>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              label="Export Selected Pages"
              variant="primary"
              onClick={handleExport}
              disabled={!hasSelection || isProcessing}
              loading={isProcessing}
            />
          </div>
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        title="Preview - After Split"
      />
    </div>
  );
}