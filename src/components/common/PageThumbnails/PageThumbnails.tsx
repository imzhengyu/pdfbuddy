import { useState, useEffect } from 'react';
import { PDFDocument } from '../../../services/pdf/types';
import styles from './PageThumbnails.module.css';

interface PageThumbnailsProps {
  file: File;
  onSelect?: (pageIndex: number) => void;
  selectedPages?: number[];
}

export function PageThumbnails({ file, onSelect, selectedPages = [] }: PageThumbnailsProps) {
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThumbnails() {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const count = pdf.getPageCount();
        setPageCount(count);
        const placeholders = Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
        setThumbnails(placeholders);
      } catch {
        setThumbnails([]);
      } finally {
        setLoading(false);
      }
    }

    loadThumbnails();
  }, [file]);

  if (loading) {
    return <div className={styles.loading}>Loading pages...</div>;
  }

  return (
    <div className={styles.grid}>
      {thumbnails.map((label, index) => (
        <div
          key={index}
          className={`${styles.thumbnail} ${selectedPages.includes(index) ? styles.selected : ''}`}
          onClick={() => onSelect?.(index)}
          data-page-index={index}
        >
          <div className={styles.box}>
            <span className={styles.pageNumber}>{index + 1}</span>
          </div>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}