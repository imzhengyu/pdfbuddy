import { useState, ReactNode } from 'react';
import { AppProvider, useApp, View } from './context/AppContext';
import { MergeView } from './components/features/MergeView/MergeView';
import { SplitView } from './components/features/SplitView/SplitView';
import { CompressView } from './components/features/CompressView/CompressView';
import { RotateView } from './components/features/RotateView/RotateView';
import { ConvertView } from './components/features/ConvertView/ConvertView';
import { OrganizeView } from './components/features/OrganizeView/OrganizeView';
import styles from './App.module.css';

const VIEWS: { key: View; label: string }[] = [
  { key: 'merge', label: 'Merge' },
  { key: 'split', label: 'Split' },
  { key: 'compress', label: 'Compress' },
  { key: 'rotate', label: 'Rotate' },
  { key: 'convert', label: 'Convert' },
  { key: 'organize', label: 'Organize' }
];

function ErrorBoundary({ children }: { children: ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (e) {
    setError(e instanceof Error ? e : new Error('Unknown error'));
    return null;
  }
}

function AppContent() {
  const { state, setView } = useApp();

  const renderView = () => {
    switch (state.currentView) {
      case 'merge': return <MergeView />;
      case 'split': return <SplitView />;
      case 'compress': return <CompressView />;
      case 'rotate': return <RotateView />;
      case 'convert': return <ConvertView />;
      case 'organize': return <OrganizeView />;
      default: return <MergeView />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h1>PDF Tool</h1>
        </div>
        <nav className={styles.nav}>
          {VIEWS.map(view => (
            <button
              key={view.key}
              className={`${styles.navButton} ${state.currentView === view.key ? styles.active : ''}`}
              onClick={() => setView(view.key)}
            >
              {view.label}
            </button>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <ErrorBoundary>
          {renderView()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;