import { useEffect, useCallback, useState, useRef } from 'react';
import styles from './PreviewModal.module.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  title?: string;
}

// Cache for parsed PDFs to avoid re-parsing
import { pdfCache } from '../../../services/pdf/pdfCache';

export function PreviewModal({ isOpen, onClose, file, title }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const pdfRef = useRef<any>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      setCurrentPage(prev => Math.max(1, prev - 1));
    } else if (e.key === 'ArrowRight') {
      setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }
  }, [onClose, totalPages]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      setCurrentPage(prev => Math.min(totalPages, prev + 1));
    } else if (e.deltaY < 0) {
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  }, [totalPages]);

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
    let cancelled = false;

    async function loadPdf() {
      if (!file || !isOpen) return;

      setIsLoading(true);
      setError(null);

      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Use cache if available
        let pdf = pdfRef.current;

        if (!pdf) {
          const cached = pdfCache.get(file);

          if (cached) {
            pdf = cached.pdf;
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdf = await loadingTask.promise;
            pdfCache.set(file, { pdf });
          }

          if (cancelled) return;
          pdfRef.current = pdf;
        }

        const numPages = pdf.numPages;
        setTotalPages(numPages);
        setCurrentPage(1);
        setPageImages([]);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError(err?.message || 'Failed to load PDF');
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [file, isOpen]);

  // Load specific page image (lazy load current page + preload adjacent)
  useEffect(() => {
    if (!isOpen || !pdfRef.current || totalPages === 0) return;

    let cancelled = false;
    const pdf = pdfRef.current;
    const scale = 1.0;

    async function loadPage(pageNum: number) {
      if (cancelled || pageNum < 1 || pageNum > totalPages) return null;

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;
        return canvas.toDataURL('image/jpeg', 0.85);
      } catch {
        return null;
      }
    }

    async function loadPages() {
      // Load current page and preload ±1 pages
      const pagesToLoad = [
        currentPage,
        currentPage - 1,
        currentPage + 1
      ].filter(p => p >= 1 && p <= totalPages);

      const results = await Promise.all(pagesToLoad.map(p => loadPage(p)));
      if (cancelled) return;

      setPageImages(prev => {
        const newImages = [...prev];
        results.forEach((img, idx) => {
          const pageNum = pagesToLoad[idx];
          newImages[pageNum - 1] = img || newImages[pageNum - 1];
        });
        return newImages;
      });
    }

    loadPages();

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentPage, totalPages]);

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

        <div className={styles.content} onWheel={handleWheel}>
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