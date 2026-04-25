import { createContext, useContext, useReducer, ReactNode } from 'react';

export type View = 'merge' | 'split' | 'compress' | 'rotate' | 'convert' | 'organize';

interface AppState {
  currentView: View;
}

type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'RESET' };

const initialState: AppState = {
  currentView: 'merge'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setView: (view: View) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setView = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, setView }}>
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