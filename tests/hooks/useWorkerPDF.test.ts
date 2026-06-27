import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkerPDF } from '../../src/hooks/useWorkerPDF';

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

describe('useWorkerPDF', () => {
  let mockWorker: any;
  let workerConstructor: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null as any,
      onerror: null as any,
    };

    workerConstructor = vi.fn(() => mockWorker);
    global.Worker = workerConstructor;
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

  it('creates worker on first startOperation', () => {
    const { result } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    expect(workerConstructor).toHaveBeenCalledTimes(1);
    expect(result.current.isProcessing).toBe(true);
  });

  it('reuses existing worker on subsequent startOperation', () => {
    const { result } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    expect(workerConstructor).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.startOperation('split', { file: new File([''], 'test.pdf'), pageRanges: [] });
    });

    // Worker should be reused, not recreated
    expect(workerConstructor).toHaveBeenCalledTimes(1);
    expect(mockWorker.terminate).not.toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(true);
  });

  it('sends cancel message with current operation id', () => {
    const { result } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    act(() => {
      result.current.cancel();
    });

    expect(mockWorker.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cancel', id: 'test-uuid-123' })
    );
    expect(result.current.isProcessing).toBe(false);
  });

  it('ignores messages from stale operation ids', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useWorkerPDF({ onSuccess }));

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    // Simulate a stale success message with different id
    const staleMessage = {
      data: { id: 'stale-id', type: 'success', result: 'old result' },
    };

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage(staleMessage);
      }
    });

    // State should not change because id doesn't match
    expect(result.current.isProcessing).toBe(true);
    expect(result.current.result).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('processes messages matching current operation id', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useWorkerPDF({ onSuccess }));

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    const successMessage = {
      data: { id: 'test-uuid-123', type: 'success', result: 'merged blob' },
    };

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage(successMessage);
      }
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.result).toBe('merged blob');
    expect(onSuccess).toHaveBeenCalledWith('merged blob');
  });

  it('processes progress messages matching current operation id', () => {
    const onProgress = vi.fn();
    const { result } = renderHook(() => useWorkerPDF({ onProgress }));

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    const progressMessage = {
      data: { id: 'test-uuid-123', type: 'progress', progress: { current: 1, total: 2, percent: 50 } },
    };

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage(progressMessage);
      }
    });

    expect(result.current.progress).toEqual({ current: 1, total: 2, percent: 50 });
    expect(onProgress).toHaveBeenCalledWith({ current: 1, total: 2, percent: 50 });
  });

  it('processes error messages matching current operation id', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWorkerPDF({ onError }));

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    const errorMessage = {
      data: { id: 'test-uuid-123', type: 'error', error: 'worker processing failed' },
    };

    act(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage(errorMessage);
      }
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('worker processing failed');
    expect(onError).toHaveBeenCalledWith('worker processing failed');
  });

  it('handles worker runtime errors', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWorkerPDF({ onError }));

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    act(() => {
      if (mockWorker.onerror) {
        mockWorker.onerror(new ErrorEvent('error', { message: 'worker crashed' }));
      }
    });

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBe('worker crashed');
    expect(onError).toHaveBeenCalledWith('worker crashed');
  });

  it('terminates worker on unmount', () => {
    const { result, unmount } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    unmount();

    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('terminates worker on reset', () => {
    const { result } = renderHook(() => useWorkerPDF());

    act(() => {
      result.current.startOperation('merge', { files: [] });
    });

    act(() => {
      result.current.reset();
    });

    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(result.current.isProcessing).toBe(false);
  });
});
