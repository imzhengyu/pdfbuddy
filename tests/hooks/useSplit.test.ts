import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useSplit } from '../../src/hooks/useSplit';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

createPDFHookTests({
  name: 'useSplit',
  useHook: () => useSplit(),
  operationName: 'split',
  invokeValid: (api) => api.split(file, [{ start: 1, end: 3 }]),
  invokeInvalid: (api) => api.split(file, []),
  expectedInvalidError: 'Please specify at least one page range to split',
  expectedServiceError: 'Split failed'
});
