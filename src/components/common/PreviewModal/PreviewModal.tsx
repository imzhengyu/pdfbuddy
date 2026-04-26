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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

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
    async function loadPageImages() {
      if (!file || !isOpen) return;

      setIsLoading(true);
      setError(null);
      setPageImages([]);
      setPdfDoc(null);

      try {
        const pdfjs = await import('pdfjs-dist');

        // Use legacy build which doesn't need external worker
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        setTotalPages(numPages);
        setCurrentPage(1);
        setPdfDoc(pdf);

        const images: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({
              canvasContext: ctx,
              viewport: viewport,
            }).promise;
            images.push(canvas.toDataURL('image/png'));
          }
        }
        setPageImages(images);
      } catch (err: any) {
        console.error('PDF load error:', err);
        setError(err?.message || 'Failed to load PDF');
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    }

    loadPageImages();
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
          {isLoading && (
            <div className={styles.loading}>Loading PDF...</div>
          )}
          {error && (
            <div className={styles.error}>
              <span>Error loading PDF</span>
              <small>{error}</small>
            </div>
          )}
          {!isLoading && !error && pageImages.length > 0 && (
            <div className={styles.previewArea} style={{ transform: `scale(${zoom / 100})` }}>
              <img
                src={pageImages[currentPage - 1]}
                alt={`Page ${currentPage} of ${totalPages}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}
          {!isLoading && !error && pageImages.length === 0 && !isLoading && (
            <div className={styles.pagePlaceholder}>
              <span>No pages to display</span>
            </div>
          )}
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