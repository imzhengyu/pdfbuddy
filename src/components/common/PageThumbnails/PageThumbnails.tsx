import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './PageThumbnails.module.css';

interface PageThumbnailsProps {
  file: File;
  onSelect?: (pageIndex: number) => void;
  selectedPages?: number[];
  onPageClick?: (pageIndex: number) => void;
  onPageDragStart?: (e: React.DragEvent, pageIndex: number) => void;
  onPageDragOver?: (e: React.DragEvent, pageIndex: number) => void;
  onPageDragEnd?: () => void;
  dragOverIndex?: number | null;
  onRotate?: (pageIndex: number) => void;
  rotatedPages?: Map<number, number>;
  showChangedIndicator?: boolean;
  onError?: (error: string) => void;
}

// Cache for parsed PDFs
import { pdfCache } from '../../../services/pdf/pdfCache';

export function PageThumbnails({
  file,
  onSelect,
  selectedPages = [],
  onPageClick,
  onPageDragStart,
  onPageDragOver,
  onPageDragEnd,
  dragOverIndex,
  onRotate,
  rotatedPages = new Map(),
  showChangedIndicator = false,
  onError
}: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<any>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
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

        const count = pdf.numPages;

        // Initialize thumbnails array with nulls
        if (!cancelled) {
          setThumbnails(new Array(count).fill(null));
          setIsInitialLoad(false);
        }

        // Load pages in chunks of 10 for faster initial render
        const chunkSize = 10;
        const scale = 0.15;

        for (let chunk = 0; chunk < Math.ceil(count / chunkSize); chunk++) {
          if (cancelled) break;

          const startIdx = chunk * chunkSize;
          const endIdx = Math.min(startIdx + chunkSize, count);

          const pagePromises = [];
          for (let i = startIdx + 1; i <= endIdx; i++) {
            pagePromises.push(pdf.getPage(i));
          }

          const pages = await Promise.all(pagePromises);

          if (cancelled) break;

          const renderPromises = pages.map(async (page) => {
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
              return canvas.toDataURL('image/jpeg', 0.5);
            }
            return null;
          });

          const chunkImages = await Promise.all(renderPromises);

          if (!cancelled) {
            setThumbnails(prev => {
              const newThumbs = [...prev];
              chunkImages.forEach((img, idx) => {
                newThumbs[startIdx + idx] = img;
              });
              return newThumbs;
            });
          }
        }
      } catch (err) {
        console.error('Failed to load thumbnails:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        if (!cancelled) {
          setError(errorMessage);
          setThumbnails([]);
          setIsInitialLoad(false);
          onError?.(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoad(false);
        }
      }
    }

    loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const handleClick = useCallback((index: number) => {
    if (onPageClick) {
      onPageClick(index);
    } else {
      onSelect?.(index);
    }
  }, [onPageClick, onSelect]);

  const handleRotate = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onRotate?.(index);
  }, [onRotate]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (onPageDragStart) {
      onPageDragStart(e, index);
    }
  }, [onPageDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (onPageDragOver) {
      onPageDragOver(e, index);
    }
  }, [onPageDragOver]);

  const handleDragEnd = useCallback(() => {
    if (onPageDragEnd) {
      onPageDragEnd();
    }
  }, [onPageDragEnd]);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.grid} ref={gridRef}>
      {isInitialLoad && thumbnails.length === 0 && (
        <div className={styles.loading}>Loading pages...</div>
      )}
      {thumbnails.map((src, index) => (
        <div
          key={index}
          className={`${styles.thumbnail} ${selectedPages.includes(index) ? styles.selected : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
          onClick={() => handleClick(index)}
          draggable={!!onPageDragStart}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          data-page-index={index}
        >
          <div className={styles.box}>
            {src ? (
              <img
                src={src}
                alt={`Page ${index + 1}`}
                className={styles.thumbnailImage}
                style={{ transform: `rotate(${rotatedPages.get(index) || 0}deg)` }}
              />
            ) : (
              <span className={styles.pageNumber}>{index + 1}</span>
            )}
            {showChangedIndicator && (rotatedPages.get(index) || 0) > 0 && (
              <span className={styles.changedDot} title="Page modified" />
            )}
            {(rotatedPages.get(index) || 0) > 0 && (
              <span className={styles.rotationBadge}>{rotatedPages.get(index)}°</span>
            )}
            {onRotate && (
              <button
                className={styles.rotateButton}
                onClick={(e) => handleRotate(e, index)}
                title="Rotate 90°"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            )}
          </div>
          <span className={styles.label}>Page {index + 1}</span>
        </div>
      ))}
    </div>
  );
}