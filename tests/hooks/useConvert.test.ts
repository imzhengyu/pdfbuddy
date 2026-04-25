import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConvert } from '../../src/hooks/useConvert';
import { ClientPDFService } from '../../src/services/pdf/ClientPDFService';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    convertToPDF: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
  }))
}));

describe('useConvert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useConvert());
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('convertToPDF function is available', () => {
    const { result } = renderHook(() => useConvert());
    expect(typeof result.current.convertToPDF).toBe('function');
  });

  it('clearError clears error state', () => {
    const { result } = renderHook(() => useConvert());
    result.current.clearError();
    expect(result.current.error).toBeNull();
  });

  it('clearError function is available', () => {
    const { result } = renderHook(() => useConvert());
    expect(typeof result.current.clearError).toBe('function');
  });

  it('convertToPDF with empty array sets error', async () => {
    const { result } = renderHook(() => useConvert());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      const ret = await result.current.convertToPDF([]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Please select at least one image to convert');
  });

  it('convertToPDF handles error from service', async () => {
    (ClientPDFService as any).mockImplementation(() => ({
      convertToPDF: vi.fn().mockRejectedValue(new Error('Conversion failed'))
    }));

    const { result } = renderHook(() => useConvert());
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    await act(async () => {
      const ret = await result.current.convertToPDF([file]);
      expect(ret).toBeNull();
    });

    expect(result.current.error).toBe('Conversion failed');
  });
});