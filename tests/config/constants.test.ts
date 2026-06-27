import { describe, it, expect } from 'vitest';
import {
  CONST_APP_CONFIG,
  CONST_PDF_CONFIG,
  CONST_OPERATION_CONFIG,
  CONST_UI_CONFIG,
  CONST_ZOOM_CONFIG,
  CONST_ERROR_CODES,
  CONST_QUALITY_PRESETS,
  CONST_MIME_TYPES,
  CONST_SUPPORTED_IMAGE_MIME_TYPES,
  CONST_ERROR_MESSAGES,
  CONST_CACHE_CONFIG,
  CONST_THUMBNAIL_CONFIG,
  CONST_PREVIEW_CONFIG,
  CONST_CONVERT_CONFIG,
  CONST_STORAGE_KEYS,
  CONST_PERFORMANCE_CONFIG,
  CONST_SANITIZE_CONFIG,
  CONST_DOWNLOAD_CONFIG,
  CONST_ROTATION_CONFIG,
  CONST_TEST_CONFIG,
} from '../../src/config/constants';

describe('constants', () => {
  describe('CONST_APP_CONFIG', () => {
    it('has correct app name', () => {
      expect(CONST_APP_CONFIG.appName).toBe('PDF Tool');
    });

    it('has correct version', () => {
      expect(CONST_APP_CONFIG.version).toBe('1.0.0');
    });
  });

  describe('CONST_PDF_CONFIG', () => {
    it('has max file size of 50MB', () => {
      expect(CONST_PDF_CONFIG.maxFileSize).toBe(50 * 1024 * 1024);
      expect(CONST_PDF_CONFIG.maxFileSizeBytes).toBe(50 * 1024 * 1024);
    });

    it('supports PDF mime type only', () => {
      expect(CONST_PDF_CONFIG.supportedMimeTypes).toEqual(['application/pdf']);
    });

    it('has correct thumbnail size', () => {
      expect(CONST_PDF_CONFIG.thumbnailSize).toEqual({ width: 120, height: 160 });
    });

    it('has cache timeout of 5 minutes', () => {
      expect(CONST_PDF_CONFIG.cacheTimeout).toBe(5 * 60 * 1000);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_OPERATION_CONFIG', () => {
    it('has default retry attempts of 3', () => {
      expect(CONST_OPERATION_CONFIG.retryAttempts).toBe(3);
    });

    it('has default retry delay of 1 second', () => {
      expect(CONST_OPERATION_CONFIG.retryDelay).toBe(1000);
    });

    it('has default backoff of 2', () => {
      expect(CONST_OPERATION_CONFIG.retryBackoff).toBe(2);
    });

    it('has timeout of 30 seconds', () => {
      expect(CONST_OPERATION_CONFIG.timeout).toBe(30000);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_UI_CONFIG', () => {
    it('has animation duration of 200ms', () => {
      expect(CONST_UI_CONFIG.animationDuration).toBe(200);
    });

    it('has toast duration of 3 seconds', () => {
      expect(CONST_UI_CONFIG.toastDuration).toBe(3000);
    });

    it('has max recent files of 10', () => {
      expect(CONST_UI_CONFIG.maxRecentFiles).toBe(10);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_ZOOM_CONFIG', () => {
    it('has min of 25', () => {
      expect(CONST_ZOOM_CONFIG.min).toBe(25);
    });

    it('has max of 200', () => {
      expect(CONST_ZOOM_CONFIG.max).toBe(200);
    });

    it('has step of 25', () => {
      expect(CONST_ZOOM_CONFIG.step).toBe(25);
    });

    it('has default of 100', () => {
      expect(CONST_ZOOM_CONFIG.default).toBe(100);
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_ERROR_CODES', () => {
    it('has FILE_TOO_LARGE error code', () => {
      expect(CONST_ERROR_CODES.FILE_TOO_LARGE).toBe('E001');
    });

    it('has INVALID_PDF error code', () => {
      expect(CONST_ERROR_CODES.INVALID_PDF).toBe('E002');
    });

    it('has PROCESSING_FAILED error code', () => {
      expect(CONST_ERROR_CODES.PROCESSING_FAILED).toBe('E003');
    });

    it('has NETWORK_ERROR error code', () => {
      expect(CONST_ERROR_CODES.NETWORK_ERROR).toBe('E004');
    });

    it('has UNKNOWN_ERROR error code', () => {
      expect(CONST_ERROR_CODES.UNKNOWN_ERROR).toBe('E999');
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_QUALITY_PRESETS', () => {
    it('has low preset with 0.3 value', () => {
      expect(CONST_QUALITY_PRESETS.low).toEqual({
        label: 'Low',
        value: 0.3,
        description: 'Smaller file, lower quality',
      });
    });

    it('has medium preset with 0.6 value', () => {
      expect(CONST_QUALITY_PRESETS.medium).toEqual({
        label: 'Medium',
        value: 0.6,
        description: 'Balanced size and quality',
      });
    });

    it('has high preset with 0.85 value', () => {
      expect(CONST_QUALITY_PRESETS.high).toEqual({
        label: 'High',
        value: 0.85,
        description: 'Larger file, high quality',
      });
    });

    // Note: as const provides TypeScript compile-time readonly only.
    // Runtime immutability via Object.freeze() would require separate implementation.
  });

  describe('CONST_MIME_TYPES', () => {
    it('has correct MIME types', () => {
      expect(CONST_MIME_TYPES.pdf).toBe('application/pdf');
      expect(CONST_MIME_TYPES.png).toBe('image/png');
      expect(CONST_MIME_TYPES.jpeg).toBe('image/jpeg');
    });
  });

  describe('CONST_SUPPORTED_IMAGE_MIME_TYPES', () => {
    it('includes PNG and JPEG types', () => {
      expect(CONST_SUPPORTED_IMAGE_MIME_TYPES).toEqual(['image/png', 'image/jpeg']);
    });
  });

  describe('CONST_ERROR_MESSAGES', () => {
    it('has merge min files message', () => {
      expect(CONST_ERROR_MESSAGES.mergeMinFiles).toBe('At least 2 files are required to merge');
    });

    it('formats invalid PDF message without reason', () => {
      expect(CONST_ERROR_MESSAGES.invalidPdf('file.pdf')).toBe('"file.pdf" is not a valid PDF');
    });

    it('formats invalid PDF message with reason', () => {
      expect(CONST_ERROR_MESSAGES.invalidPdf('file.pdf', 'corrupted')).toBe(
        '"file.pdf" is not a valid PDF: corrupted'
      );
    });

    it('has default error message', () => {
      expect(CONST_ERROR_MESSAGES.defaultError).toBe('An unexpected error occurred');
    });

    it('has reorganize empty order message', () => {
      expect(CONST_ERROR_MESSAGES.reorganizeEmptyOrder).toBe('At least one page must be in the new order');
    });

    it('has unsupported rotation message', () => {
      expect(CONST_ERROR_MESSAGES.unsupportedRotation).toBe('Mirror rotation is not supported by this operation');
    });

    it('formats failed to process message', () => {
      expect(CONST_ERROR_MESSAGES.failedToProcess('file.pdf', 'oops')).toBe('Failed to process "file.pdf": oops');
    });
  });

  describe('CONST_CACHE_CONFIG', () => {
    it('has correct cache capacities', () => {
      expect(CONST_CACHE_CONFIG.pdfCacheCapacity).toBe(5);
      expect(CONST_CACHE_CONFIG.validationCacheSize).toBe(16);
    });
  });

  describe('CONST_THUMBNAIL_CONFIG', () => {
    it('has correct thumbnail rendering settings', () => {
      expect(CONST_THUMBNAIL_CONFIG.chunkSize).toBe(10);
      expect(CONST_THUMBNAIL_CONFIG.concurrencyLimit).toBe(3);
      expect(CONST_THUMBNAIL_CONFIG.scale).toBe(0.25);
      expect(CONST_THUMBNAIL_CONFIG.jpegQuality).toBe(0.85);
    });
  });

  describe('CONST_PREVIEW_CONFIG', () => {
    it('has correct preview rendering settings', () => {
      expect(CONST_PREVIEW_CONFIG.scale).toBe(1.0);
      expect(CONST_PREVIEW_CONFIG.jpegQuality).toBe(0.85);
    });
  });

  describe('CONST_CONVERT_CONFIG', () => {
    it('has correct page sizes', () => {
      expect(CONST_CONVERT_CONFIG.pageSizes.a4).toEqual({ width: 595, height: 842 });
      expect(CONST_CONVERT_CONFIG.pageSizes.letter).toEqual({ width: 612, height: 792 });
    });

    it('has correct default conversion options', () => {
      expect(CONST_CONVERT_CONFIG.defaultMargin).toBe(20);
      expect(CONST_CONVERT_CONFIG.defaultImageQuality).toBe(0.92);
      expect(CONST_CONVERT_CONFIG.defaultImageScale).toBe(2);
    });
  });

  describe('CONST_STORAGE_KEYS', () => {
    it('has correct storage keys', () => {
      expect(CONST_STORAGE_KEYS.theme).toBe('pdf-tool-theme');
      expect(CONST_STORAGE_KEYS.recentFiles).toBe('pdf-tool-recent-files');
    });
  });

  describe('CONST_PERFORMANCE_CONFIG', () => {
    it('has correct performance settings', () => {
      expect(CONST_PERFORMANCE_CONFIG.maxSnapshots).toBe(10);
      expect(CONST_PERFORMANCE_CONFIG.formatDurationThresholdMs).toBe(1000);
    });
  });

  describe('CONST_SANITIZE_CONFIG', () => {
    it('has correct sanitize settings', () => {
      expect(CONST_SANITIZE_CONFIG.maxFilenameLength).toBe(255);
    });
  });

  describe('CONST_DOWNLOAD_CONFIG', () => {
    it('has correct download defaults', () => {
      expect(CONST_DOWNLOAD_CONFIG.defaultFilename).toBe('document.pdf');
    });
  });

  describe('CONST_ROTATION_CONFIG', () => {
    it('has correct rotation step', () => {
      expect(CONST_ROTATION_CONFIG.stepDegrees).toBe(90);
    });
  });

  describe('CONST_TEST_CONFIG', () => {
    it('has correct waitFor defaults', () => {
      expect(CONST_TEST_CONFIG.waitForTimeout).toBe(1000);
      expect(CONST_TEST_CONFIG.waitForInterval).toBe(50);
    });

    it('has correct E2E timeouts', () => {
      expect(CONST_TEST_CONFIG.e2eDefaultTimeout).toBe(10000);
      expect(CONST_TEST_CONFIG.e2eButtonTimeout).toBe(15000);
      expect(CONST_TEST_CONFIG.e2ePerformanceThresholdMs).toBe(15000);
    });
  });
});