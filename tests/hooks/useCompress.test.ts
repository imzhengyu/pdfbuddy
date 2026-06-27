import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useCompress } from '../../src/hooks/useCompress';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

createPDFHookTests({
  name: 'useCompress',
  useHook: () => useCompress(),
  operationName: 'compress',
  invokeValid: (api) => api.compress(file, 'medium'),
  expectedServiceError: 'Compress failed'
});
