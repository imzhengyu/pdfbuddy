import { formatFileSize } from '../../../utils/fileUtils';
import { Button } from '../Button/Button';
import styles from './FileList.module.css';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
  thumbnail?: string;
}

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showPageCount?: boolean;
}

export function FileList({ files, onRemove, showPageCount = true }: FileListProps) {
  return (
    <div className={styles.list}>
      {files.map((fileItem, index) => (
        <div key={fileItem.id} className={styles.item}>
          <div className={styles.info}>
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.name}>{fileItem.file.name}</span>
            <span className={styles.size}>{formatFileSize(fileItem.file.size)}</span>
            {showPageCount && fileItem.pageCount !== undefined && (
              <span className={styles.pages}>{fileItem.pageCount} pages</span>
            )}
          </div>
          <Button
            label="Remove"
            variant="outline"
            size="sm"
            onClick={() => onRemove(fileItem.id)}
          />
        </div>
      ))}
    </div>
  );
}