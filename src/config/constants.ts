/**
 * Application Configuration Constants
 *
 * Centralized configuration for the PDF Tool application.
 * All magic numbers and constants should be defined here.
 */

export const CONST_APP_CONFIG = {
  appName: 'PDF Tool',
  version: '1.0.0',
  description: 'A modern PDF processing tool',
} as const;

export const CONST_PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFileSizeBytes: 50 * 1024 * 1024,
  dropzoneMaxSize: 20 * 1024 * 1024, // 20MB
  supportedMimeTypes: ['application/pdf'],
  supportedExtensions: ['.pdf'],
  thumbnailSize: { width: 120, height: 160 },
  maxPagesPreview: 100,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  pdfJsWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
} as const;

export const CONST_OPERATION_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  retryBackoff: 2,
  timeout: 30000,
  maxConcurrentOperations: 3,
} as const;

export const CONST_UI_CONFIG = {
  animationDuration: 200,
  toastDuration: 3000,
  maxRecentFiles: 10,
  thumbnailLoadDelay: 100,
  debounceDelay: 300,
} as const;

export const CONST_ZOOM_CONFIG = {
  min: 25,
  max: 200,
  step: 25,
  default: 100,
} as const;

export const CONST_ERROR_CODES = {
  FILE_TOO_LARGE: 'E001',
  INVALID_PDF: 'E002',
  PROCESSING_FAILED: 'E003',
  NETWORK_ERROR: 'E004',
  FILE_NOT_FOUND: 'E005',
  PERMISSION_DENIED: 'E006',
  UNKNOWN_ERROR: 'E999',
} as const;

export const CONST_QUALITY_PRESETS = {
  low: { label: 'Low', value: 0.3, description: 'Smaller file, lower quality' },
  medium: { label: 'Medium', value: 0.6, description: 'Balanced size and quality' },
  high: { label: 'High', value: 0.85, description: 'Larger file, high quality' },
} as const;

export const CONST_MIME_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpeg: 'image/jpeg',
} as const;

export const CONST_SUPPORTED_IMAGE_MIME_TYPES = [
  CONST_MIME_TYPES.png,
  CONST_MIME_TYPES.jpeg,
];

export const CONST_ERROR_MESSAGES = {
  mergeMinFiles: 'At least 2 files are required to merge',
  invalidPdf: (name: string, reason?: string) =>
    reason
      ? `"${name}" is not a valid PDF: ${reason}`
      : `"${name}" is not a valid PDF`,
  defaultError: 'An unexpected error occurred',
  reorganizeEmptyOrder: 'At least one page must be in the new order',
  unsupportedRotation: 'Mirror rotation is not supported by this operation',
  failedToProcess: (name: string, message: string) => `Failed to process "${name}": ${message}`,
} as const;

export const CONST_CACHE_CONFIG = {
  pdfCacheCapacity: 5,
  validationCacheSize: 16,
} as const;

export const CONST_THUMBNAIL_CONFIG = {
  chunkSize: 10,
  concurrencyLimit: 3,
  scale: 0.25,
  jpegQuality: 0.85,
} as const;

export const CONST_PREVIEW_CONFIG = {
  scale: 1.0,
  jpegQuality: 0.85,
} as const;

export const CONST_CONVERT_CONFIG = {
  pageSizes: {
    a4: { width: 595, height: 842 },
    letter: { width: 612, height: 792 },
  },
  defaultMargin: 20,
  defaultImageQuality: 0.92,
  defaultImageScale: 2,
} as const;

export const CONST_STORAGE_KEYS = {
  theme: 'pdf-tool-theme',
  recentFiles: 'pdf-tool-recent-files',
} as const;

export const CONST_PERFORMANCE_CONFIG = {
  maxSnapshots: 10,
  formatDurationThresholdMs: 1000,
} as const;

export const CONST_SANITIZE_CONFIG = {
  maxFilenameLength: 255,
} as const;

export const CONST_DOWNLOAD_CONFIG = {
  defaultFilename: 'document.pdf',
} as const;

export const CONST_ROTATION_CONFIG = {
  stepDegrees: 90,
} as const;

export const CONST_TEST_CONFIG = {
  waitForTimeout: 1000,
  waitForInterval: 50,
  e2eDefaultTimeout: 10000,
  e2eButtonTimeout: 15000,
  e2ePerformanceThresholdMs: 15000,
} as const;

export type ErrorCode = typeof CONST_ERROR_CODES[keyof typeof CONST_ERROR_CODES];
export type QualityPreset = keyof typeof CONST_QUALITY_PRESETS;
