import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompress } from '../../src/hooks/useCompress';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    compress: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }))
}));

describe('useCompress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useCompress());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('compress function is available', () => {
    const { result } = renderHook(() => useCompress());
    expect(typeof result.current.compress).toBe('function');
  });

  it('clearError clears error state', () => {
    const { result } = renderHook(() => useCompress());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useCompress());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('compress handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      compress: vi.fn().mockRejectedValue(new Error('Compress failed'))
    }));

    const { result } = renderHook(() => useCompress());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.compress(file, 'medium');
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Compress failed');
  });
});