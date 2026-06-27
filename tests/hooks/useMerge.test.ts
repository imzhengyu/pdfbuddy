import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useMerge } from '../../src/hooks/useMerge';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const file1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
const file2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });

createPDFHookTests({
  name: 'useMerge',
  useHook: () => useMerge(),
  operationName: 'merge',
  invokeValid: (api) => api.merge([file1, file2]),
  invokeInvalid: (api) => api.merge([file1]),
  expectedInvalidError: 'Please select at least 2 PDF files to merge',
  expectedServiceError: 'Merge failed'
});
