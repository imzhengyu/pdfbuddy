import { ProcessingProgress } from '../../../services/pdf/types';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: ProcessingProgress;
  showLabel?: boolean;
  variant?: 'linear' | 'circular';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  progress,
  showLabel = true,
  variant = 'linear',
  size = 'md'
}: ProgressBarProps) {
  if (variant === 'circular') {
    const strokeWidth = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
    const viewBoxSize = size === 'sm' ? 48 : size === 'lg' ? 120 : 80;
    const radius = (viewBoxSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress.percent / 100) * circumference;

    return (
      <div className={`${styles.circular} ${styles[size]}`}>
        <div className={styles.circularTrack}>
          <svg width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <circle
              className={styles.circularBg}
              cx={viewBoxSize / 2}
              cy={viewBoxSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <circle
              className={styles.circularFill}
              cx={viewBoxSize / 2}
              cy={viewBoxSize / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className={styles.circularLabel}>{progress.percent}%</span>
        </div>
        {showLabel && (
          <span className={styles.circularDetail}>
            {progress.current} of {progress.total}
          </span>
        )}
      </div>
    );
  }

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