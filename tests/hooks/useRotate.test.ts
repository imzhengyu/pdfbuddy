import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRotate } from '../../src/hooks/useRotate';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    rotate: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }))
}));

describe('useRotate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useRotate());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('rotate function is available', () => {
    const { result } = renderHook(() => useRotate());
    expect(typeof result.current.rotate).toBe('function');
  });

  it('clearError clears error state', () => {
    const { result } = renderHook(() => useRotate());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('rotate with empty rotations sets error', async () => {
    const { result } = renderHook(() => useRotate());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.rotate(file, []);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Please select at least one page to rotate');
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useRotate());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('rotate handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      rotate: vi.fn().mockRejectedValue(new Error('Rotate failed'))
    }));

    const { result } = renderHook(() => useRotate());
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      const ret = await result.current.rotate(file, [{ pageIndex: 0, degrees: 90 }]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Rotate failed');
  });
});