/**
 * The six feature hooks are thin wrappers around the shared `usePDFOperation`
 * factory, so they are exercised by the same generated suite. They live in one
 * file on purpose: each test file costs a full jsdom environment, and that
 * per-file setup - not the assertions - dominates this suite's runtime.
 */
import { vi } from 'vitest';
import { createPDFHookTests } from '../utils/hookTestFactory';
import { useMerge } from '../../src/hooks/useMerge';
import { useSplit } from '../../src/hooks/useSplit';
import { useRotate } from '../../src/hooks/useRotate';
import { useConvert } from '../../src/hooks/useConvert';
import { useOrganize } from '../../src/hooks/useOrganize';

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn(),
  getClientPDFService: vi.fn()
}));

const pdf1 = new File(['test1'], 'test1.pdf', { type: 'application/pdf' });
const pdf2 = new File(['test2'], 'test2.pdf', { type: 'application/pdf' });
const pdf = new File(['test'], 'test.pdf', { type: 'application/pdf' });
const image = new File(['image'], 'test.png', { type: 'image/png' });

createPDFHookTests({
  name: 'useMerge',
  useHook: () => useMerge(),
  operationName: 'merge',
  invokeValid: (api) => api.merge([pdf1, pdf2]),
  invokeInvalid: (api) => api.merge([pdf1]),
  expectedInvalidError: 'Please select at least 2 PDF files to merge',
  expectedServiceError: 'Merge failed'
});

createPDFHookTests({
  name: 'useSplit',
  useHook: () => useSplit(),
  operationName: 'split',
  invokeValid: (api) => api.split(pdf, [{ start: 1, end: 3 }]),
  invokeInvalid: (api) => api.split(pdf, []),
  expectedInvalidError: 'Please specify at least one page range to split',
  expectedServiceError: 'Split failed'
});


createPDFHookTests({
  name: 'useRotate',
  useHook: () => useRotate(),
  operationName: 'rotate',
  invokeValid: (api) => api.rotate(pdf, [{ pageIndex: 0, type: 'rotate', degrees: 90 }]),
  invokeInvalid: (api) => api.rotate(pdf, []),
  expectedInvalidError: 'Please select at least one page to rotate',
  expectedServiceError: 'Rotate failed'
});

createPDFHookTests({
  name: 'useConvert',
  useHook: () => useConvert(),
  operationName: 'convertToPDF',
  invokeValid: (api) => api.convertToPDF([image]),
  invokeInvalid: (api) => api.convertToPDF([]),
  expectedInvalidError: 'Please select at least one image to convert',
  expectedServiceError: 'Conversion failed'
});

createPDFHookTests({
  name: 'useOrganize',
  useHook: () => useOrganize(),
  operationName: 'reorganize',
  invokeValid: (api) => api.reorganize(pdf, [{ originalIndex: 0, newIndex: 0 }]),
  invokeInvalid: (api) => api.reorganize(pdf, []),
  expectedInvalidError: 'Please select pages to reorganize',
  expectedServiceError: 'Reorganize failed'
});