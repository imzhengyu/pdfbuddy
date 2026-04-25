import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSplit } from '../../src/hooks/useSplit';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    split: vi.fn().mockResolvedValue([new Blob(['test'], { type: 'application/pdf' })])
  }))
}));

describe('useSplit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useSplit());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('split function is available', () => {
    const { result } = renderHook(() => useSplit());
    expect(typeof result.current.split).toBe('function');
  });

  it('clearError clears error state', async () => {
    const { result } = renderHook(() => useSplit());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('split with empty ranges sets error', async () => {
    const mockSplit = vi.fn().mockResolvedValue([new Blob()]);
    (ClientPDFService as any).mockImplementation(() => ({
      split: mockSplit
    }));

    const { result } = renderHook(() => useSplit());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.split(file, []);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Please specify at least one page range to split');
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useSplit());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('split sets isProcessing and progress', async () => {
    const { result } = renderHook(() => useSplit());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    let progressCallback: any;
    (ClientPDFService as any).mockImplementation(() => ({
      split: vi.fn().mockImplementation((_f: any, _r: any, prog: any) => {
        progressCallback = prog;
        return Promise.resolve([new Blob()]);
      })
    }));

    await act(async () => {
      result.current.split(file, [{ start: 1, end: 3 }]);
    });

    expect(result.current.isProcessing).toBe(false);
  });

  it('split handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      split: vi.fn().mockRejectedValue(new Error('Split failed'))
    }));

    const { result } = renderHook(() => useSplit());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.split(file, [{ start: 1, end: 3 }]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Split failed');
  });
});