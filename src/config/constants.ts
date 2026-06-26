/**
 * Application Configuration Constants
 *
 * Centralized configuration for the PDF Tool application.
 * All magic numbers and constants should be defined here.
 */

export const APP_CONFIG = {
  appName: 'PDF Tool',
  version: '1.0.0',
  description: 'A modern PDF processing tool',
} as const;

export const PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFileSizeBytes: 50 * 1024 * 1024,
  supportedMimeTypes: ['application/pdf'],
  thumbnailSize: { width: 120, height: 160 },
  maxPagesPreview: 100,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  supportedExtensions: ['.pdf'],
  pdfJsWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
} as const;

export const OPERATION_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  retryBackoff: 2,
  timeout: 30000,
  maxConcurrentOperations: 3,
} as const;

export const UI_CONFIG = {
  animationDuration: 200,
  toastDuration: 3000,
  maxRecentFiles: 10,
  thumbnailLoadDelay: 100,
  debounceDelay: 300,
} as const;

export const ZOOM_CONFIG = {
  min: 25,
  max: 200,
  step: 25,
  default: 100,
} as const;

export const ERROR_CODES = {
  FILE_TOO_LARGE: 'E001',
  INVALID_PDF: 'E002',
  PROCESSING_FAILED: 'E003',
  NETWORK_ERROR: 'E004',
  FILE_NOT_FOUND: 'E005',
  PERMISSION_DENIED: 'E006',
  UNKNOWN_ERROR: 'E999',
} as const;

export const QUALITY_PRESETS = {
  low: { label: 'Low', value: 0.3, description: 'Smaller file, lower quality' },
  medium: { label: 'Medium', value: 0.6, description: 'Balanced size and quality' },
  high: { label: 'High', value: 0.85, description: 'Larger file, high quality' },
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type QualityPreset = keyof typeof QUALITY_PRESETS;