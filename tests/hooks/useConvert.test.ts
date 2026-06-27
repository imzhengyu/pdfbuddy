import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useConvert } from '../../src/hooks/useConvert';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn()
}));

const imageFile = new File(['image'], 'test.png', { type: 'image/png' });

createPDFHookTests({
  name: 'useConvert',
  useHook: () => useConvert(),
  operationName: 'convertToPDF',
  invokeValid: (api) => api.convertToPDF([imageFile]),
  invokeInvalid: (api) => api.convertToPDF([]),
  expectedInvalidError: 'Please select at least one image to convert',
  expectedServiceError: 'Conversion failed'
});
