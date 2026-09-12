import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ClientPDFService, getClientPDFService } from '../../src/services/pdf/ClientPDFService';
import type { ProcessingProgress } from '../../src/services/pdf/types';

interface PDFOperationAPI {
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  clearError: () => void;
}

interface PDFHookTestOptions<T extends PDFOperationAPI> {
  name: string;
  useHook: () => T;
  operationName: string;
  invokeValid: (api: T) => Promise<unknown>;
  invokeInvalid?: (api: T) => Promise<unknown>;
  expectedInvalidError?: string;
  expectedServiceError: string;
}

export function createPDFHookTests<T extends PDFOperationAPI>(options: PDFHookTestOptions<T>) {
  describe(options.name, () => {
    beforeEach(() => {
      vi.clearAllMocks();
      const mockService = {
        [options.operationName]: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' }))
      };
      (ClientPDFService as any).mockImplementation(() => mockService);
      (getClientPDFService as any).mockReturnValue(mockService);
    });

    it('returns initial state', () => {
      const { result } = renderHook(() => options.useHook());
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.progress).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('clearError clears error state', () => {
      const { result } = renderHook(() => options.useHook());
      act(() => {
        result.current.clearError();
      });
      expect(result.current.error).toBeNull();
    });

    if (options.invokeInvalid && options.expectedInvalidError) {
      it('returns validation error for invalid input', async () => {
        const { result } = renderHook(() => options.useHook());

        await act(async () => {
          const ret = await options.invokeInvalid!(result.current);
          expect(ret).toBeNull();
        });

        expect(result.current.error).toBe(options.expectedInvalidError);
      });
    }

    it('handles service error', async () => {
      const mockService = {
        [options.operationName]: vi.fn().mockRejectedValue(new Error(options.expectedServiceError))
      };
      (ClientPDFService as any).mockImplementation(() => mockService);
      (getClientPDFService as any).mockReturnValue(mockService);

      const { result } = renderHook(() => options.useHook());

      await act(async () => {
        const ret = await options.invokeValid(result.current);
        expect(ret).toBeNull();
      });

      expect(result.current.error).toBe(options.expectedServiceError);
    });
  });
}
