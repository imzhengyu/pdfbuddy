import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CONST_ERROR_MESSAGES,
  CONST_LIMITS_CONFIG,
  CONST_THUMBNAIL_CONFIG,
} from '../../../config';
import { getPdfjsLib } from '../../../services/pdf/pdfjsInitializer';
import { pdfCache } from '../../../services/pdf/pdfCache';
import { getFileId } from '../../../utils/fileUtils';
import styles from './PageThumbnails.module.css';

interface PageThumbnailsProps {
  file: File;
  onSelect?: (pageIndex: number) => void;
  selectedPages?: number[];
  /**
   * Display order as original page indices (e.g. `[2, 0, 1]`). Selection and
   * drag callbacks always receive the original page index; only the labels and
   * the on-screen position follow this order. Defaults to natural order.
   */
  order?: number[];
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

interface ThumbnailItemProps {
  index: number;
  /**
   * Position on screen, used for the visible "Page N" label and aria text.
   * Defaults to the page index for callers that do not reorder.
   */
  position?: number;
  src: string | null;
  fileId: string;
  selected: boolean;
  dragOver: boolean;
  rotated: number;
  showChangedIndicator: boolean;
  onRotate?: (e: React.MouseEvent, index: number) => void;
  onClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  draggable: boolean;
}

/** The slice of the pdf.js document API this component relies on. */
interface PdfJsDocumentLike {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getViewport(params: { scale: number }): { width: number; height: number };
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: unknown;
    }): { promise: Promise<void> };
  }>;
}

export const ThumbnailItem = React.memo(function ThumbnailItem({
  index,
  position,
  src,
  fileId,
  selected,
  dragOver,
  rotated,
  showChangedIndicator,
  onRotate,
  onClick,
  onKeyDown,
  onDragStart,
  onDragOver,
  onDragEnd,
  draggable,
}: ThumbnailItemProps) {
  const displayPosition = position ?? index;

  return (
    <div
      key={`${fileId}-${index}`}
      role="button"
      tabIndex={0}
      aria-label={`Select page ${displayPosition + 1}`}
      className={`${styles.thumbnail} ${selected ? styles.selected : ''} ${dragOver ? styles.dragOver : ''}`}
      onClick={() => onClick(index)}
      onKeyDown={(e) => onKeyDown(e, index)}
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      data-page-index={index}
      data-page-position={displayPosition}
      data-testid="thumbnail-item"
    >
      <div className={styles.box}>
        {src ? (
          <img
            src={src}
            alt={`Page ${displayPosition + 1}`}
            className={styles.thumbnailImage}
            style={{ transform: `rotate(${rotated}deg)` }}
          />
        ) : (
          <span className={styles.pageNumber}>{displayPosition + 1}</span>
        )}
        {showChangedIndicator && rotated > 0 && (
          <span className={styles.changedDot} title="Page modified" />
        )}
        {rotated > 0 && (
          <span className={styles.rotationBadge}>{rotated}°</span>
        )}
        {onRotate && (
          <button
            type="button"
            className={styles.rotateButton}
            onClick={(e) => onRotate(e, index)}
            title="Rotate 90°"
            aria-label="Rotate page 90 degrees"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        )}
      </div>
      <span className={styles.label}>Page {displayPosition + 1}</span>
    </div>
  );
});

export function PageThumbnails({
  file,
  onSelect,
  selectedPages = [],
  order,
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
  const [isTruncated, setIsTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfRef = useRef<{ fileId: string; pdf: PdfJsDocumentLike } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const fileId = getFileId(file);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      try {
        // Start every load from a clean slate so a new file cannot briefly show
        // the previous file's pages.
        if (!cancelled) {
          setThumbnails([]);
          setIsInitialLoad(true);
          setError(null);
        }

        const pdfjsLib = await getPdfjsLib();

        // Use the cached document only when it belongs to this file: a re-render
        // with a different file must not keep rendering the previous document.
        let pdf = pdfRef.current && pdfRef.current.fileId === fileId ? pdfRef.current.pdf : null;

        if (!pdf) {
          const cached = await pdfCache.get(file);
          let loaded: PdfJsDocumentLike;

          if (cached) {
            loaded = cached.pdf;
          } else {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            loaded = await loadingTask.promise;
            await pdfCache.set(file, { pdf: loaded });
          }

          if (cancelled) return;
          pdf = loaded;
          pdfRef.current = { fileId, pdf: loaded };
        }

        if (!pdf) {
          throw new Error(CONST_ERROR_MESSAGES.pdfLoadFailed);
        }

        const pageCount = pdf.numPages;
        // A tab cannot rasterise an unbounded number of pages; past the limit the
        // grid shows the first N pages and says so.
        const count = Math.min(pageCount, CONST_LIMITS_CONFIG.maxThumbnailPages);
        if (!cancelled) {
          setIsTruncated(pageCount > count);
        }

        // Initialize thumbnails array with nulls
        if (!cancelled) {
          setThumbnails(new Array(count).fill(null));
          setIsInitialLoad(false);
        }

        // Load pages in chunks for faster initial render
        const chunkSize = CONST_THUMBNAIL_CONFIG.chunkSize;
        const concurrencyLimit = CONST_THUMBNAIL_CONFIG.concurrencyLimit;
        const scale = CONST_THUMBNAIL_CONFIG.scale;

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

          // Render with limited concurrency to avoid overwhelming the main thread
          const chunkImages: (string | null)[] = new Array(pages.length).fill(null);

          async function renderPage(page: any, index: number): Promise<void> {
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
              chunkImages[index] = canvas.toDataURL('image/jpeg', CONST_THUMBNAIL_CONFIG.jpegQuality);
            }

            // Clear canvas dimensions to release memory
            canvas.width = 0;
            canvas.height = 0;
          }

          // Process pages with concurrency limit
          let pageIndex = 0;
          async function worker(): Promise<void> {
            while (pageIndex < pages.length) {
              const currentIndex = pageIndex++;
              await renderPage(pages[currentIndex], currentIndex);
            }
          }

          const workers = Array.from({ length: concurrencyLimit }, () => worker());
          await Promise.all(workers);

          if (!cancelled) {
            requestAnimationFrame(() => {
              setThumbnails(prev => {
                const newThumbs = [...prev];
                chunkImages.forEach((img, idx) => {
                  newThumbs[startIdx + idx] = img;
                });
                return newThumbs;
              });
            });
          }

          // Yield between chunks: rendering a long document otherwise keeps the
          // main thread busy from the first page to the last.
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (err) {
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(index);
    }
  }, [handleClick]);

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
      {isTruncated && (
        <p className={styles.limitNote} role="status">
          {CONST_ERROR_MESSAGES.thumbnailLimitReached(CONST_LIMITS_CONFIG.maxThumbnailPages)}
        </p>
      )}
      {isInitialLoad && thumbnails.length === 0 && (
        <div className={styles.loading} data-testid="thumbnail-loading">Loading pages...</div>
      )}
      {(order ?? thumbnails.map((_, index) => index)).map((pageIndex, position) => (
        <ThumbnailItem
          key={`${fileId}-${pageIndex}`}
          index={pageIndex}
          position={position}
          src={thumbnails[pageIndex]}
          fileId={fileId}
          selected={selectedPages.includes(pageIndex)}
          dragOver={dragOverIndex === pageIndex}
          rotated={rotatedPages.get(pageIndex) || 0}
          showChangedIndicator={showChangedIndicator}
          onRotate={onRotate ? handleRotate : undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          draggable={!!onPageDragStart}
        />
      ))}
    </div>
  );
}
