import { sanitizeFilename, sanitizeExtension, isValidFilename } from './sanitize';

/**
 * Downloads a Blob as a file with sanitized filename.
 * Rejects invalid filenames rather than silently sanitizing when possible.
 *
 * @param blob - The Blob to download
 * @param filename - The desired filename (will be sanitized)
 * @param options - Options for handling invalid filenames
 * @param options.rejectInvalid - If true, throws on invalid filename instead of sanitizing
 */
export function downloadBlob(
  blob: Blob,
  filename: string,
  options: { rejectInvalid?: boolean } = {}
): void {
  const { rejectInvalid = false } = options;

  // Validate filename
  if (!isValidFilename(filename)) {
    if (rejectInvalid) {
      throw new Error(`Invalid filename: ${filename}`);
    }
    // Fallback to sanitized default
    filename = 'document.pdf';
  }

  const sanitized = sanitizeFilename(filename);

  // Validate extension is safe
  const safeExtension = sanitizeExtension(sanitized, ['.pdf']);
  const baseName = sanitized.replace(/\.[^.]+$/, '');
  const finalFilename = baseName + safeExtension;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export async function downloadBlobsAsZip(
  blobs: { name: string; blob: Blob }[],
  zipFilename: string,
  options: { rejectInvalid?: boolean } = {}
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Sanitize each blob name to prevent path traversal in zip entries
  for (const { name, blob } of blobs) {
    const sanitizedName = sanitizeFilename(name);
    const safeExtension = sanitizeExtension(sanitizedName, ['.pdf']);
    const baseName = sanitizedName.replace(/\.[^.]+$/, '');
    zip.file(baseName + safeExtension, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename, options);
}