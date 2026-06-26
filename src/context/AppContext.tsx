import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { UI_CONFIG } from '../config';

export type View = 'merge' | 'split' | 'compress' | 'rotate' | 'convert' | 'organize';

export type Theme = 'light' | 'dark' | 'system';

export interface RecentFile {
  name: string;
  path?: string;
  size: number;
  addedAt: number;
}

interface AppState {
  currentView: View;
  theme: Theme;
  recentFiles: RecentFile[];
}

type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'ADD_RECENT_FILE'; payload: RecentFile }
  | { type: 'CLEAR_RECENT_FILES' }
  | { type: 'RESET' };

const STORAGE_KEYS = {
  theme: 'pdf-tool-theme',
  recentFiles: 'pdf-tool-recent-files',
} as const;

function isLocalStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors (e.g. quota exceeded, private mode)
  }
}

function getInitialTheme(): Theme {
  const saved = safeGetItem(STORAGE_KEYS.theme);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  const isDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
}

function getInitialRecentFiles(): RecentFile[] {
  const saved = safeGetItem(STORAGE_KEYS.recentFiles);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    const isDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
  return theme;
}

function createInitialState(): AppState {
  return {
    currentView: 'merge',
    theme: getInitialTheme(),
    recentFiles: getInitialRecentFiles(),
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_RECENT_FILE': {
      const filtered = state.recentFiles.filter(f => f.path !== action.payload.path);
      const updated = [action.payload, ...filtered].slice(0, UI_CONFIG.maxRecentFiles);
      return { ...state, recentFiles: updated };
    }
    case 'CLEAR_RECENT_FILES':
      return { ...state, recentFiles: [] };
    case 'RESET':
      return { ...createInitialState(), theme: state.theme, recentFiles: state.recentFiles };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  setView: (view: View) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  recentFiles: RecentFile[];
  addRecentFile: (file: Omit<RecentFile, 'addedAt'>) => void;
  clearRecentFiles: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  // Persist theme to localStorage and update document attribute
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.theme, state.theme);
    const resolved = getResolvedTheme(state.theme);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [state.theme]);

  // Persist recentFiles to localStorage
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.recentFiles, JSON.stringify(state.recentFiles));
  }, [state.recentFiles]);

  const setView = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const addRecentFile = (file: Omit<RecentFile, 'addedAt'>) => {
    dispatch({ type: 'ADD_RECENT_FILE', payload: { ...file, addedAt: Date.now() } });
  };

  const clearRecentFiles = () => {
    dispatch({ type: 'CLEAR_RECENT_FILES' });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setView,
        theme: state.theme,
        setTheme,
        recentFiles: state.recentFiles,
        addRecentFile,
        clearRecentFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}