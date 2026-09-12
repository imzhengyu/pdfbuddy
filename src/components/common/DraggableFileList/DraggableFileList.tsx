import { useState, useCallback, useRef } from 'react';
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
  // A drop already performed the move; the dragend fallback must not repeat it.
  const dropHandledRef = useRef(false);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dropHandledRef.current = false;
    // Some browsers (Firefox in particular) only start a drag when the
    // dragstart handler puts something on the dataTransfer.
    e.dataTransfer?.setData('text/plain', String(index));
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer?.getData('text/plain'));

    if (Number.isInteger(from) && from >= 0 && from !== index) {
      dropHandledRef.current = true;
      onReorder(from, index);
    }

    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    // Fallback for drags that never produced a drop event.
    if (
      !dropHandledRef.current &&
      dragIndex !== null &&
      dragOverIndex !== null &&
      dragIndex !== dragOverIndex
    ) {
      onReorder(dragIndex, dragOverIndex);
    }
    dropHandledRef.current = false;
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
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
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
