import { useEffect, useCallback, useState } from 'react';
import styles from './PreviewModal.module.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  title?: string;
}

export function PreviewModal({ isOpen, onClose, file, title }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      setCurrentPage(prev => Math.max(1, prev - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }
  }, [onClose, totalPages]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    async function loadPageCount() {
      if (file && isOpen) {
        try {
          const { PDFDocument } = await import('pdf-lib');
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          setTotalPages(pdf.getPageCount());
          setCurrentPage(1);
        } catch {
          setTotalPages(0);
        }
      }
    }
    loadPageCount();
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoom(prev => Math.max(25, prev - 25));
  const handleFit = () => setZoom(100);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title || 'Preview'}: {file.name}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.previewArea} style={{ transform: `scale(${zoom / 100})` }}>
            <div className={styles.pagePlaceholder}>
              <span>Page {currentPage} of {totalPages}</span>
              <p className={styles.hint}>PDF preview requires canvas rendering</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.navigation}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              aria-label="Previous page"
            >
              ◀
            </button>
            <span className={styles.pageInfo}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              ▶
            </button>
          </div>

          <div className={styles.zoomControls}>
            <button onClick={handleZoomOut} aria-label="Zoom out">−</button>
            <span className={styles.zoomLevel}>{zoom}%</span>
            <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
            <button onClick={handleFit} className={styles.fitBtn}>Fit</button>
          </div>
        </div>
      </div>
    </div>
  );
}