import { useEffect, useCallback, useState, useRef } from 'react';
import {
  CONST_CACHE_CONFIG,
  CONST_ERROR_MESSAGES,
  CONST_LIMITS_CONFIG,
  CONST_PREVIEW_CONFIG,
  CONST_ZOOM_CONFIG,
} from '../../../config';
import { getPdfjsLib } from '../../../services/pdf/pdfjsInitializer';
import { pdfCache } from '../../../services/pdf/pdfCache';
import { getFileId } from '../../../utils/fileUtils';
import styles from './PreviewModal.module.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  title?: string;
}

// Module-level cache for rendered page images, keyed by fileId + page number.
// This persists across modal opens/closes so reopening the same file avoids re-rendering.
// Bounded by CONST_CACHE_CONFIG.previewImageCacheCapacity: each entry is a base64
// data URL, so an unbounded cache grows with every document the user previews.
const pageImageCache = new Map<string, string>();

/** Clears the module-level preview image cache. Exposed for tests. */
export function clearPreviewImageCache(): void {
  pageImageCache.clear();
}

/** Number of cached page images. Exposed for tests that assert the bound. */
export function getPreviewImageCacheSize(): number {
  return pageImageCache.size;
}

/** Reads a cached page image and marks it as most recently used. */
function readCachedPageImage(key: string): string | undefined {
  const cached = pageImageCache.get(key);
  if (cached !== undefined) {
    pageImageCache.delete(key);
    pageImageCache.set(key, cached);
  }
  return cached;
}

/** Stores a page image, evicting the least recently used entry when full. */
function cachePageImage(key: string, dataUrl: string): void {
  pageImageCache.delete(key);
  pageImageCache.set(key, dataUrl);

  while (pageImageCache.size > CONST_CACHE_CONFIG.previewImageCacheCapacity) {
    const oldest = pageImageCache.keys().next().value;
    if (oldest === undefined) break;
    pageImageCache.delete(oldest);
  }
}

export function PreviewModal({ isOpen, onClose, file, title }: PreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState<number>(CONST_ZOOM_CONFIG.default);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const pdfRef = useRef<any>(null);
  const fileIdRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Move focus into the dialog while it is open and hand it back to whatever
  // had it before, so keyboard users are not left behind the overlay.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen]);

  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

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
        const pdfjsLib = await getPdfjsLib();

        // Use cache if available
        let pdf = pdfRef.current;

        if (!pdf) {
          const cached = await pdfCache.get(file);

          if (cached) {
            pdf = cached.pdf;
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdf = await loadingTask.promise;
            await pdfCache.set(file, { pdf });
          }

          if (cancelled) return;
          pdfRef.current = pdf;
        }

        const numPages = pdf.numPages;
        if (numPages > CONST_LIMITS_CONFIG.maxPagesPerDocument) {
          // Rendering an unbounded document in a tab is what kills the machine;
          // the same ceiling the operations use applies to the preview.
          setError(
            CONST_ERROR_MESSAGES.pageLimitExceeded(
              numPages,
              CONST_LIMITS_CONFIG.maxPagesPerDocument
            )
          );
          setTotalPages(0);
          return;
        }
        setTotalPages(numPages);
        setCurrentPage(1);

        // Pre-populate pageImages from module cache if available
        const fileId = getFileId(file);
        fileIdRef.current = fileId;
        const cachedImages: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const cacheKey = `${fileId}-page-${i}`;
          const cached = readCachedPageImage(cacheKey);
          if (cached) {
            cachedImages[i - 1] = cached;
          }
        }
        if (cachedImages.length > 0) {
          setPageImages(cachedImages);
        }
      } catch (err: any) {
        if (!cancelled) {
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
    const scale = CONST_PREVIEW_CONFIG.scale;
    const fileId = fileIdRef.current;

    async function loadPage(pageNum: number): Promise<string | null> {
      if (cancelled || pageNum < 1 || pageNum > totalPages) return null;

      // Check module cache first
      const cacheKey = `${fileId}-page-${pageNum}`;
      const cached = readCachedPageImage(cacheKey);
      if (cached) {
        return cached;
      }

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
        const dataUrl = canvas.toDataURL('image/jpeg', CONST_PREVIEW_CONFIG.jpegQuality);

        // Store in module cache
        cachePageImage(cacheKey, dataUrl);

        return dataUrl;
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
          if (img) {
            newImages[pageNum - 1] = img;
          }
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

  const handleZoomIn = () => setZoom(prev => Math.min(CONST_ZOOM_CONFIG.max, prev + CONST_ZOOM_CONFIG.step));
  const handleZoomOut = () => setZoom(prev => Math.max(CONST_ZOOM_CONFIG.min, prev - CONST_ZOOM_CONFIG.step));
  const handleFit = () => setZoom(CONST_ZOOM_CONFIG.default);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div className={styles.header}>
          <h3 id="preview-modal-title" data-testid="preview-modal-header">{title || 'Preview'}: {file.name}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
            ×
          </button>
        </div>

        <div className={styles.content} onWheel={handleWheel}>
          {isLoading && (
            <div className={styles.loading} data-testid="preview-loading">Loading PDF...</div>
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
              type="button"
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
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Next page"
            >
              ▶
            </button>
          </div>

          <div className={styles.zoomControls}>
            <button type="button" onClick={handleZoomOut} aria-label="Zoom out">−</button>
            <span className={styles.zoomLevel}>{zoom}%</span>
            <button type="button" onClick={handleZoomIn} aria-label="Zoom in">+</button>
            <button type="button" onClick={handleFit} className={styles.fitBtn}>Fit</button>
          </div>
        </div>
      </div>
    </div>
  );
}
