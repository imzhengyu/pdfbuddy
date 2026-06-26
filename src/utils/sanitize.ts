/**
 * Sanitization Utilities
 *
 * Security-focused functions for sanitizing user input.
 */

/**
 * Sanitizes a filename to prevent path traversal and other attacks.
 *
 * @param filename - The original filename from user input
 * @returns A safe filename suitable for file system operations
 *
 * @example
 * sanitizeFilename('../../../etc/passwd') // Returns 'passwd'
 * sanitizeFilename('my file.pdf') // Returns 'my file.pdf'
 * sanitizeFilename('../../../config.json') // Returns 'config.json'
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'document';
  }

  // Remove path separators and drive letters
  let sanitized = filename.replace(/[/\\:*?"<>|]/g, '_');

  // Remove multiple consecutive dots (path traversal)
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  // Limit length to 255 characters (common filesystem limit)
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.slice(0, 250);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  // Fallback for empty or invalid names
  return sanitized || 'document';
}

/**
 * Validates and extracts a safe file extension.
 *
 * @param filename - The filename to extract extension from
 * @param allowedExtensions - Array of allowed extensions (with or without dot)
 * @returns The safe extension including the dot prefix
 *
 * @example
 * sanitizeExtension('document.pdf', ['.pdf']) // Returns '.pdf'
 * sanitizeExtension('document.PDF', ['.pdf']) // Returns '.pdf'
 * sanitizeExtension('document.txt', ['.pdf']) // Returns '.pdf' (fallback)
 */
export function sanitizeExtension(
  filename: string,
  allowedExtensions: string[] = ['.pdf']
): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  // Ensure extensions have dot prefix
  const normalized = allowedExtensions.map(e =>
    e.startsWith('.') ? e.toLowerCase() : `.${e.toLowerCase()}`
  );

  const found = normalized.find(e => e === `.${ext}`);
  return found || normalized[0];
}

/**
 * Sanitizes a path component (single directory or filename).
 *
 * @param pathComponent - The path component to sanitize
 * @returns A safe path component
 */
export function sanitizePathComponent(pathComponent: string): string {
  if (!pathComponent || typeof pathComponent !== 'string') {
    return '';
  }

  // Remove any path separators
  return pathComponent.replace(/[/\\]/g, '_').slice(0, 255);
}

/**
 * Validates if a filename is safe for display (not necessarily for saving).
 *
 * @param filename - The filename to validate
 * @returns True if filename appears safe for display
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Check for empty or only whitespace
  if (!filename.trim()) {
    return false;
  }

  // Check length
  if (filename.length > 255) {
    return false;
  }

  // Check for path traversal attempts
  if (filename.includes('..')) {
    return false;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }

  return true;
}