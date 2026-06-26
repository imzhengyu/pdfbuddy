import { ReactNode } from 'react';
import { Button } from '../Button/Button';
import styles from './FileInfoHeader.module.css';

interface FileInfoHeaderProps {
  /** File name to display. */
  fileName: string;
  /** Optional additional info (e.g. file size). */
  info?: string;
  /** Label for the change file button. */
  changeButtonLabel?: string;
  /** Callback when the change file button is clicked. */
  onChangeFile?: () => void;
  /** Optional extra action button. */
  action?: ReactNode;
}

/**
 * Reusable file info header showing the current file name and a change button.
 */
export function FileInfoHeader({
  fileName,
  info,
  changeButtonLabel = 'Change File',
  onChangeFile,
  action,
}: FileInfoHeaderProps) {
  return (
    <div className={styles.fileInfo}>
      <span className={styles.name}>
        <strong>{fileName}</strong>
        {info && <span className={styles.info}> ({info})</span>}
      </span>
      <div className={styles.actions}>
        {action}
        {onChangeFile && (
          <Button
            label={changeButtonLabel}
            variant="outline"
            size="sm"
            onClick={onChangeFile}
          />
        )}
      </div>
    </div>
  );
}
