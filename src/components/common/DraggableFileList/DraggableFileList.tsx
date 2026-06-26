import { useState, useCallback } from 'react';
import { Button } from '../Button/Button';
import { formatFileSize } from '../../../utils/fileUtils';
import styles from './DraggableFileList.module.css';

export interface DraggableFileItem {
  id: string;
  file: File;
}

interface DraggableFileListProps {
  files: DraggableFileItem[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
}

export function DraggableFileList({ files, onReorder, onRemove }: DraggableFileListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      onReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, dragOverIndex, onReorder]);

  return (
    <div className={styles.list}>
      {files.map((fileItem, index) => (
        <div
          key={fileItem.id}
          className={`${styles.item} ${dragIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <span className={styles.dragHandle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </span>
          <span className={styles.index}>{index + 1}</span>
          <span className={styles.name}>{fileItem.file.name}</span>
          <span className={styles.size}>{formatFileSize(fileItem.file.size)}</span>
          <div className={styles.removeButton}>
            <Button
              label="Remove"
              variant="outline"
              size="sm"
              onClick={() => onRemove(fileItem.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}