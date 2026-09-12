import { describe, expect, it } from 'vitest';
import {
  CONST_APP_CONFIG,
  CONST_PDF_CONFIG,
  CONST_OPERATION_CONFIG,
  CONST_UI_CONFIG,
  CONST_ZOOM_CONFIG,
  CONST_ERROR_CODES,
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

/**
 * The app's tunables, grouped by concern.
 *
 * This used to be one `it()` per field - 46 of them - each asserting that a
 * literal equalled itself. That shape can only fail when you deliberately change
 * a value, and it buries the relationships that actually catch a bad edit. The
 * assertions are all still here; they are grouped, and joined by relational
 * checks (bytes agreeing with MB, zoom defaults inside their own range, error
 * codes unique and well formed).
 */
describe('config constants', () => {
  it('identifies the app', () => {
    expect(CONST_APP_CONFIG.appName).toBe('PDF Tool');
    expect(CONST_APP_CONFIG.version).toBe('1.0.0');
  });

  it('caps upload size and keeps the byte and megabyte limits in agreement', () => {
    expect(CONST_PDF_CONFIG.maxFileSize).toBe(50 * 1024 * 1024);
    expect(CONST_PDF_CONFIG.maxFileSizeBytes).toBe(50 * 1024 * 1024);
    expect(CONST_PDF_CONFIG.maxFileSizeBytes).toBe(CONST_PDF_CONFIG.maxFileSize);
    expect(CONST_PDF_CONFIG.supportedMimeTypes).toEqual(['application/pdf']);
    expect(CONST_PDF_CONFIG.thumbnailSize).toEqual({ width: 120, height: 160 });
    expect(CONST_PDF_CONFIG.cacheTimeout).toBe(5 * 60 * 1000);
  });

  it('retries with backoff and allows processing longer than the gap between retries', () => {
    expect(CONST_OPERATION_CONFIG.retryAttempts).toBe(3);
    expect(CONST_OPERATION_CONFIG.retryDelay).toBe(1000);
    expect(CONST_OPERATION_CONFIG.retryBackoff).toBe(2);
    expect(CONST_OPERATION_CONFIG.timeout).toBe(30000);
    expect(CONST_OPERATION_CONFIG.retryBackoff).toBeGreaterThan(1);
    expect(CONST_OPERATION_CONFIG.timeout).toBeGreaterThan(CONST_OPERATION_CONFIG.retryDelay);
  });

  it('keeps the zoom default inside the zoom range and the range on a whole number of steps', () => {
    expect(CONST_UI_CONFIG.animationDuration).toBe(200);
    expect(CONST_UI_CONFIG.toastDuration).toBe(3000);
    expect(CONST_UI_CONFIG.maxRecentFiles).toBe(10);

    expect(CONST_ZOOM_CONFIG.min).toBe(25);
    expect(CONST_ZOOM_CONFIG.max).toBe(200);
    expect(CONST_ZOOM_CONFIG.step).toBe(25);
    expect(CONST_ZOOM_CONFIG.default).toBe(100);

    expect(CONST_ZOOM_CONFIG.min).toBeLessThan(CONST_ZOOM_CONFIG.default);
    expect(CONST_ZOOM_CONFIG.default).toBeLessThan(CONST_ZOOM_CONFIG.max);
    expect((CONST_ZOOM_CONFIG.max - CONST_ZOOM_CONFIG.min) % CONST_ZOOM_CONFIG.step).toBe(0);
  });

  it('uses unique, well-formed error codes', () => {
    expect(CONST_ERROR_CODES.FILE_TOO_LARGE).toBe('E001');
    expect(CONST_ERROR_CODES.INVALID_PDF).toBe('E002');
    expect(CONST_ERROR_CODES.PROCESSING_FAILED).toBe('E003');
    expect(CONST_ERROR_CODES.NETWORK_ERROR).toBe('E004');
    expect(CONST_ERROR_CODES.UNKNOWN_ERROR).toBe('E999');

    const codes = Object.values(CONST_ERROR_CODES);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) {
      expect(code).toMatch(/^E\d{3}$/);
    }
  });


  it('defines the MIME types it reads and writes', () => {
    expect(CONST_MIME_TYPES.pdf).toBe('application/pdf');
    expect(CONST_MIME_TYPES.png).toBe('image/png');
    expect(CONST_MIME_TYPES.jpeg).toBe('image/jpeg');

    expect(CONST_SUPPORTED_IMAGE_MIME_TYPES).toEqual(['image/png', 'image/jpeg']);
    expect(CONST_SUPPORTED_IMAGE_MIME_TYPES[0]).toBe(CONST_MIME_TYPES.png);
    expect(CONST_SUPPORTED_IMAGE_MIME_TYPES[1]).toBe(CONST_MIME_TYPES.jpeg);
  });

  it('formats user-facing error messages', () => {
    expect(CONST_ERROR_MESSAGES.mergeMinFiles).toBe('At least 2 files are required to merge');
    expect(CONST_ERROR_MESSAGES.invalidPdf('file.pdf')).toBe('"file.pdf" is not a valid PDF');
    expect(CONST_ERROR_MESSAGES.invalidPdf('file.pdf', 'corrupted')).toBe(
      '"file.pdf" is not a valid PDF: corrupted'
    );
    expect(CONST_ERROR_MESSAGES.defaultError).toBe('An unexpected error occurred');
    expect(CONST_ERROR_MESSAGES.reorganizeEmptyOrder).toBe('At least one page must be in the new order');
    expect(CONST_ERROR_MESSAGES.unsupportedRotation).toBe('Mirror rotation is not supported by this operation');
    expect(CONST_ERROR_MESSAGES.failedToProcess('file.pdf', 'oops')).toBe('Failed to process "file.pdf": oops');
  });

  it('configures caching, thumbnail, preview and conversion rendering', () => {
    expect(CONST_CACHE_CONFIG.pdfCacheCapacity).toBe(5);
    expect(CONST_CACHE_CONFIG.validationCacheSize).toBe(16);

    expect(CONST_THUMBNAIL_CONFIG.chunkSize).toBe(10);
    expect(CONST_THUMBNAIL_CONFIG.concurrencyLimit).toBe(3);
    expect(CONST_THUMBNAIL_CONFIG.scale).toBe(0.25);
    expect(CONST_THUMBNAIL_CONFIG.jpegQuality).toBe(0.85);

    expect(CONST_PREVIEW_CONFIG.scale).toBe(1.0);
    expect(CONST_PREVIEW_CONFIG.jpegQuality).toBe(0.85);

    expect(CONST_CONVERT_CONFIG.pageSizes.a4).toEqual({ width: 595, height: 842 });
    expect(CONST_CONVERT_CONFIG.pageSizes.letter).toEqual({ width: 612, height: 792 });
    expect(CONST_CONVERT_CONFIG.defaultMargin).toBe(20);
    expect(CONST_CONVERT_CONFIG.defaultImageQuality).toBe(0.92);
    expect(CONST_CONVERT_CONFIG.defaultImageScale).toBe(2);

    expect(CONST_THUMBNAIL_CONFIG.concurrencyLimit).toBeLessThan(CONST_THUMBNAIL_CONFIG.chunkSize);
  });

  it('configures storage keys, benchmarking, sanitising, downloads and rotation', () => {
    expect(CONST_STORAGE_KEYS.theme).toBe('pdf-tool-theme');
    expect(CONST_STORAGE_KEYS.recentFiles).toBe('pdf-tool-recent-files');

    expect(CONST_PERFORMANCE_CONFIG.maxSnapshots).toBe(10);
    expect(CONST_PERFORMANCE_CONFIG.formatDurationThresholdMs).toBe(1000);

    expect(CONST_SANITIZE_CONFIG.maxFilenameLength).toBe(255);
    expect(CONST_DOWNLOAD_CONFIG.defaultFilename).toBe('document.pdf');
    expect(CONST_ROTATION_CONFIG.stepDegrees).toBe(90);

    expect(360 % CONST_ROTATION_CONFIG.stepDegrees).toBe(0);
  });

  it('sets the unit and E2E harness timings', () => {
    expect(CONST_TEST_CONFIG.waitForTimeout).toBe(1000);
    expect(CONST_TEST_CONFIG.waitForInterval).toBe(50);
    expect(CONST_TEST_CONFIG.e2eDefaultTimeout).toBe(10000);
    expect(CONST_TEST_CONFIG.e2eButtonTimeout).toBe(15000);
    expect(CONST_TEST_CONFIG.e2ePerformanceThresholdMs).toBe(15000);

    expect(CONST_TEST_CONFIG.waitForInterval).toBeLessThan(CONST_TEST_CONFIG.waitForTimeout);
    expect(CONST_TEST_CONFIG.e2eDefaultTimeout).toBeLessThanOrEqual(CONST_TEST_CONFIG.e2eButtonTimeout);
  });
});