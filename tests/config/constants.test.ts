import { describe, it, expect } from 'vitest';
import {
  APP_CONFIG,
  PDF_CONFIG,
  OPERATION_CONFIG,
  UI_CONFIG,
  ZOOM_CONFIG,
  ERROR_CODES,
  QUALITY_PRESETS,
} from '../../src/config/constants';

describe('constants', () => {
  describe('APP_CONFIG', () => {
    it('has correct app name', () => {
      expect(APP_CONFIG.appName).toBe('PDF Tool');
    });

    it('has correct version', () => {
      expect(APP_CONFIG.version).toBe('1.0.0');
    });
  });

  describe('PDF_CONFIG', () => {
    it('has max file size of 50MB', () => {
      expect(PDF_CONFIG.maxFileSize).toBe(50 * 1024 * 1024);
      expect(PDF_CONFIG.maxFileSizeBytes).toBe(50 * 1024 * 1024);
    });

    it('supports PDF mime type only', () => {
      expect(PDF_CONFIG.supportedMimeTypes).toEqual(['application/pdf']);
    });

    it('has correct thumbnail size', () => {
      expect(PDF_CONFIG.thumbnailSize).toEqual({ width: 120, height: 160 });
    });

    it('has cache timeout of 5 minutes', () => {
      expect(PDF_CONFIG.cacheTimeout).toBe(5 * 60 * 1000);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('OPERATION_CONFIG', () => {
    it('has default retry attempts of 3', () => {
      expect(OPERATION_CONFIG.retryAttempts).toBe(3);
    });

    it('has default retry delay of 1 second', () => {
      expect(OPERATION_CONFIG.retryDelay).toBe(1000);
    });

    it('has default backoff of 2', () => {
      expect(OPERATION_CONFIG.retryBackoff).toBe(2);
    });

    it('has timeout of 30 seconds', () => {
      expect(OPERATION_CONFIG.timeout).toBe(30000);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('UI_CONFIG', () => {
    it('has animation duration of 200ms', () => {
      expect(UI_CONFIG.animationDuration).toBe(200);
    });

    it('has toast duration of 3 seconds', () => {
      expect(UI_CONFIG.toastDuration).toBe(3000);
    });

    it('has max recent files of 10', () => {
      expect(UI_CONFIG.maxRecentFiles).toBe(10);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('ZOOM_CONFIG', () => {
    it('has min of 25', () => {
      expect(ZOOM_CONFIG.min).toBe(25);
    });

    it('has max of 200', () => {
      expect(ZOOM_CONFIG.max).toBe(200);
    });

    it('has step of 25', () => {
      expect(ZOOM_CONFIG.step).toBe(25);
    });

    it('has default of 100', () => {
      expect(ZOOM_CONFIG.default).toBe(100);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('ERROR_CODES', () => {
    it('has FILE_TOO_LARGE error code', () => {
      expect(ERROR_CODES.FILE_TOO_LARGE).toBe('E001');
    });

    it('has INVALID_PDF error code', () => {
      expect(ERROR_CODES.INVALID_PDF).toBe('E002');
    });

    it('has PROCESSING_FAILED error code', () => {
      expect(ERROR_CODES.PROCESSING_FAILED).toBe('E003');
    });

    it('has NETWORK_ERROR error code', () => {
      expect(ERROR_CODES.NETWORK_ERROR).toBe('E004');
    });

    it('has UNKNOWN_ERROR error code', () => {
      expect(ERROR_CODES.UNKNOWN_ERROR).toBe('E999');
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('QUALITY_PRESETS', () => {
    it('has low preset with 0.3 value', () => {
      expect(QUALITY_PRESETS.low).toEqual({
        label: 'Low',
        value: 0.3,
        description: 'Smaller file, lower quality',
      });
    });

    it('has medium preset with 0.6 value', () => {
      expect(QUALITY_PRESETS.medium).toEqual({
        label: 'Medium',
        value: 0.6,
        description: 'Balanced size and quality',
      });
    });

    it('has high preset with 0.85 value', () => {
      expect(QUALITY_PRESETS.high).toEqual({
        label: 'High',
        value: 0.85,
        description: 'Larger file, high quality',
      });
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });
});