import { ReactNode } from 'react';
import styles from './FeatureViewShell.module.css';

interface FeatureViewShellProps {
  /** View title displayed in the header. */
  title: string;
  /** Short description of the feature. */
  description: string;
  /** Whether the view is in its empty state (no file selected). */
  isEmpty: boolean;
  /** Content shown when the view is empty (typically a DropZone). */
  emptyView: ReactNode;
  /** Main workspace content shown when a file is present. */
  workspace: ReactNode | (() => ReactNode);
}

/**
 * Common layout shell for feature views.
 * Renders a consistent header, empty-state handling, and workspace container.
 */
export function FeatureViewShell({
  title,
  description,
  isEmpty,
  emptyView,
  workspace,
}: FeatureViewShellProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      {isEmpty ? (
        emptyView
      ) : (
        <div className={styles.workspace}>
          {typeof workspace === 'function' ? workspace() : workspace}
        </div>
      )}
    </div>
  );
}
