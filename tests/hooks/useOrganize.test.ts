import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrganize } from '../../src/hooks/useOrganize';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    reorganize: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }))
}));

describe('useOrganize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useOrganize());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('reorganize function is available', () => {
    const { result } = renderHook(() => useOrganize());
    expect(typeof result.current.reorganize).toBe('function');
  });

  it('clearError clears error state', () => {
    const { result } = renderHook(() => useOrganize());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useOrganize());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('reorganize handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      reorganize: vi.fn().mockRejectedValue(new Error('Reorganize failed'))
    }));

    const { result } = renderHook(() => useOrganize());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.reorganize(file, [{ originalIndex: 0, newIndex: 0 }]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Reorganize failed');
  });
});