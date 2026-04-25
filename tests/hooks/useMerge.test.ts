import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMerge } from '../../src/hooks/useMerge';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    merge: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }))
}));

describe('useMerge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useMerge());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('merge function is available', () => {
    const { result } = renderHook(() => useMerge());
    expect(typeof result.current.merge).toBe('function');
  });

  it('clearError clears error state', () => {
    const { result } = renderHook(() => useMerge());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('merge with less than 2 files sets error', async () => {
    const { result } = renderHook(() => useMerge());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.merge([file]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Please select at least 2 PDF files to merge');
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useMerge());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('merge handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      merge: vi.fn().mockRejectedValue(new Error('Merge failed'))
    }));

    const { result } = renderHook(() => useMerge());
    const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.merge([file1, file2]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Merge failed');
  });
});