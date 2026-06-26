import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useApp } from '../../src/context/AppContext';
import React from 'react';

describe('AppContext', () => {
  describe('useApp hook', () => {
    it('throws error when used outside AppProvider', () => {
      let error: Error | null = null;
      const TestComponent = () => {
        try {
          useApp();
        } catch (e) {
          error = e as Error;
        }
        return null;
      };
      render(<TestComponent />);
      expect(error).toBeTruthy();
      expect(error?.message).toBe('useApp must be used within AppProvider');
    });

    it('returns { state, setView } when inside provider', () => {
      let contextValue: any;
      const TestComponent = () => {
        contextValue = useApp();
        return null;
      };
      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );
      expect(contextValue).toHaveProperty('state');
      expect(contextValue).toHaveProperty('setView');
      expect(contextValue.state.currentView).toBe('merge');
    });
  });

  describe('AppProvider integration', () => {
    it('renders children correctly', () => {
      render(
        <AppProvider>
          <div data-testid="child">Child Content</div>
        </AppProvider>
      );
      expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
    });
  });
});