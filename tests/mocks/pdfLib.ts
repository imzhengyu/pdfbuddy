import { vi } from 'vitest';

export interface MockPDFDocumentOptions {
  pageCount?: number;
  rotation?: number;
}

export function createMockPDFPage(options?: { rotation?: number }) {
  return {
    getRotation: () => ({ angle: options?.rotation ?? 0 }),
    setRotation: vi.fn(),
  };
}

export function createMockPDFDocument(options?: MockPDFDocumentOptions) {
  const pageCount = options?.pageCount ?? 5;
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  const pages = indices.map(() => createMockPDFPage({ rotation: options?.rotation ?? 0 }));

  const mockPage = createMockPDFPage({ rotation: options?.rotation ?? 0 });

  return {
    getPageCount: vi.fn().mockReturnValue(pageCount),
    getPage: vi.fn().mockImplementation((index: number) => pages[index]),
    getPages: vi.fn().mockReturnValue(pages),
    getPageIndices: vi.fn().mockReturnValue(indices),
    copyPages: vi.fn().mockResolvedValue(pages.map(() => ({ ...mockPage, addPage: vi.fn() }))),
    addPage: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
    embedPage: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    embedPng: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    embedJpg: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
}

export function createMockPDFLib(options?: MockPDFDocumentOptions) {
  return {
    PDFDocument: {
      create: vi.fn().mockResolvedValue(createMockPDFDocument(options)),
      load: vi.fn().mockResolvedValue(createMockPDFDocument(options)),
    },
    degrees: vi.fn((angle: number) => ({ angle })),
  };
}
