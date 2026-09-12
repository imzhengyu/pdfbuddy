import '@testing-library/jest-dom';
import { vi } from 'vitest';

// This setup file runs for every test file, including the ones that opt into the
// node environment (see environmentMatchGlobs in vitest.config.ts). Everything
// that needs a DOM is therefore guarded, so a node-environment file importing
// this file does not crash on load.

// Mock localStorage for components that read it at render time
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }),
  key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null),
  length: 0,
} as unknown as Storage;

Object.defineProperty(global.localStorage, 'length', {
  get: () => Object.keys(mockStorage).length,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof URL !== 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
}

// The remainder only makes sense with a DOM present.
if (typeof window !== 'undefined') {
  // Mock matchMedia for theme detection
  global.matchMedia = vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (typeof HTMLCanvasElement !== 'undefined') {
  // Mock canvas for thumbnail generation if needed
  HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
    if (contextId === '2d') {
      return {
        drawImage: vi.fn(),
        fillText: vi.fn(),
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(4 * 100 * 100),
          width: 100,
          height: 100,
        }),
        putImageData: vi.fn(),
        createImageData: vi.fn().mockReturnValue({
          data: new Uint8ClampedArray(4 * 100 * 100),
          width: 100,
          height: 100,
        }),
        scale: vi.fn(),
        translate: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        rect: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 0 }),
        canvas: { width: 100, height: 100 },
      };
    }
    return null;
  });

  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
  HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback | null) => {
    if (callback) {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }
  });
}