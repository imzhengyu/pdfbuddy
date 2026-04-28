import { Button } from '../Button/Button';
import styles from './ErrorDisplay.module.css';

interface ErrorDisplayProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  variant?: 'inline' | 'alert';
}

export function ErrorDisplay({
  message,
  onDismiss,
  onRetry,
  variant = 'alert'
}: ErrorDisplayProps) {
  if (!message) return null;

  return (
    <div className={`${styles.error} ${styles[variant]}`} role="alert">
      <div className={styles.content}>
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className={styles.message}>{message}</span>
      </div>
      <div className={styles.actions}>
        {onRetry && (
          <Button label="Retry" variant="outline" size="sm" onClick={onRetry} />
        )}
        {onDismiss && (
          <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}