import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useRotate } from '../../src/hooks/useRotate';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

createPDFHookTests({
  name: 'useRotate',
  useHook: () => useRotate(),
  operationName: 'rotate',
  invokeValid: (api) => api.rotate(file, [{ pageIndex: 0, type: 'rotate', degrees: 90 }]),
  invokeInvalid: (api) => api.rotate(file, []),
  expectedInvalidError: 'Please select at least one page to rotate',
  expectedServiceError: 'Rotate failed'
});
