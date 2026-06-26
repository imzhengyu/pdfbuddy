import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  /** Error message to display. */
  message: string | null;
  /** Callback when the dismiss button is clicked. */
  onDismiss?: () => void;
}

/**
 * Reusable error banner component.
 * Displays an error message with an optional dismiss button.
 */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className={styles.error} role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss error">
          ×
        </button>
      )}
    </div>
  );
}
