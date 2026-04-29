import { useState, useEffect } from 'react';
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
}

export function PageThumbnails({
  file,
  onSelect,
  selectedPages = [],
  onPageClick,
  onPageDragStart,
  onPageDragOver,
  onPageDragEnd,
  dragOverIndex,
  onRotate
}: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThumbnails() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const count = pdf.numPages;

        const images: string[] = [];
        for (let i = 1; i <= count; i++) {
          const page = await pdf.getPage(i);
          const scale = 0.5;
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
        setThumbnails(images);
      } catch (err) {
        console.error('Failed to load thumbnails:', err);
        setThumbnails([]);
      } finally {
        setLoading(false);
      }
    }

    loadThumbnails();
  }, [file]);

  const handleClick = (index: number) => {
    if (onPageClick) {
      onPageClick(index);
    } else {
      onSelect?.(index);
    }
  };

  const handleRotate = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onRotate?.(index);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (onPageDragStart) {
      onPageDragStart(e, index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (onPageDragOver) {
      onPageDragOver(e, index);
    }
  };

  const handleDragEnd = () => {
    if (onPageDragEnd) {
      onPageDragEnd();
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading pages...</div>;
  }

  return (
    <div className={styles.grid}>
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
              <img src={src} alt={`Page ${index + 1}`} className={styles.thumbnailImage} />
            ) : (
              <span className={styles.pageNumber}>{index + 1}</span>
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