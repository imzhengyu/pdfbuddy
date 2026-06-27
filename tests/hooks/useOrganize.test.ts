import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useOrganize } from '../../src/hooks/useOrganize';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

createPDFHookTests({
  name: 'useOrganize',
  useHook: () => useOrganize(),
  operationName: 'reorganize',
  invokeValid: (api) => api.reorganize(file, [{ originalIndex: 0, newIndex: 0 }]),
  invokeInvalid: (api) => api.reorganize(file, []),
  expectedInvalidError: 'Please select pages to reorganize',
  expectedServiceError: 'Reorganize failed'
});
