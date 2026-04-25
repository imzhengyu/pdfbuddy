import { ProcessingProgress } from '../../../services/pdf/types';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: ProcessingProgress;
  showLabel?: boolean;
}

export function ProgressBar({ progress, showLabel = true }: ProgressBarProps) {
  return (
    <div className={styles.container}>
      {showLabel && (
        <div className={styles.label}>
          <span>Processing...</span>
          <span>{progress.percent}%</span>
        </div>
      )}
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${progress.percent}%` }}
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className={styles.detail}>
        {progress.current} of {progress.total}
      </div>
    </div>
  );
}