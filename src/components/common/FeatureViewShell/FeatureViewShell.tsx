import { ReactNode } from 'react';
import styles from './FeatureViewShell.module.css';

interface FeatureViewShellProps {
  /** View title displayed in the header. */
  title: string;
  /** Short description of the feature. */
  description: string;
  /** Step-by-step usage notes shown in the left-hand panel. */
  usage?: string[];
  /** Hard limits for this feature, shown at the top right. */
  limits?: string[];
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
  usage,
  limits,
  isEmpty,
  emptyView,
  workspace,
}: FeatureViewShellProps) {
  const hasUsage = Boolean(usage && usage.length > 0);
  const hasLimits = Boolean(limits && limits.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        {hasLimits && (
          <aside className={styles.limits} aria-label={`${title} limits`}>
            <h3 className={styles.limitsTitle}>Limits</h3>
            <ul className={styles.limitsList}>
              {limits!.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <div className={styles.body}>
        {hasUsage && (
          <aside className={styles.usage} aria-label={`How to use ${title}`}>
            <h3 className={styles.usageTitle}>How to use</h3>
            <ol className={styles.usageSteps}>
              {usage!.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </aside>
        )}

        <div className={styles.content}>
          {isEmpty ? (
            emptyView
          ) : (
            <div className={styles.workspace}>
              {typeof workspace === 'function' ? workspace() : workspace}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
