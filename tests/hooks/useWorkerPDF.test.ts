import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkerPDF } from '../../src/hooks/useWorkerPDF';

// Mock the worker module
vi.mock('../../src/workers/workerTypes', () => ({
  WorkerRequest: vi.fn(),
  WorkerOutgoingMessage: vi.fn(),
  WorkerProgressMessage: vi.fn(),
  WorkerSuccessMessage: vi.fn(),
  WorkerErrorMessage: vi.fn(),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('useWorkerPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useWorkerPDF());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('startOperation is a function', () => {
    const { result } = renderHook(() => useWorkerPDF());
    expect(typeof result.current.startOperation).toBe('function');
  });

  it('cancel is a function', () => {
    const { result } = renderHook(() => useWorkerPDF());
    expect(typeof result.current.cancel).toBe('function');
  });

  it('reset is a function', () => {
    const { result } = renderHook(() => useWorkerPDF());
    expect(typeof result.current.reset).toBe('function');
  });

  it('reset clears all state', () => {
    const { result } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('accepts onProgress callback option', () => {
    const onProgress = vi.fn();
    renderHook(() => useWorkerPDF({ onProgress }));
    // Callback is stored, not immediately called
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('accepts onError callback option', () => {
    const onError = vi.fn();
    renderHook(() => useWorkerPDF({ onError }));
    // Callback is stored
    expect(onError).not.toHaveBeenCalled();
  });

  it('accepts onSuccess callback option', () => {
    const onSuccess = vi.fn();
    renderHook(() => useWorkerPDF({ onSuccess }));
    // Callback is stored
    expect(onSuccess).not.toHaveBeenCalled();
  });
});