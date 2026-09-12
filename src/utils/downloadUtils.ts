import { sanitizeFilename, sanitizeExtension, isValidFilename } from './sanitize';
import { CONST_DOWNLOAD_CONFIG } from '../config';

type ExtensionMap = Record<string, readonly string[]>;

/**
 * Picks the extensions a download is allowed to keep.
 *
 * The blob's MIME type wins, so a ZIP of split pages stays `.zip` and exported
 * page images stay `.png` / `.jpg`. When the blob has no usable type, the
 * caller's requested extension is honoured if it is on the safe list, and a
 * PDF is assumed otherwise.
 */
function resolveAllowedExtensions(blob: Blob, filename: string): string[] {
  const byMimeType = (CONST_DOWNLOAD_CONFIG.extensionsByMimeType as ExtensionMap)[blob.type];
  if (byMimeType) {
    return [...byMimeType];
  }

  const requested = `.${filename.split('.').pop()?.toLowerCase() ?? ''}`;
  const safeExtensions = CONST_DOWNLOAD_CONFIG.safeExtensions as readonly string[];
  if (safeExtensions.indexOf(requested) !== -1) {
    return [requested];
  }

  return [...CONST_DOWNLOAD_CONFIG.fallbackExtensions];
}

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
    filename = CONST_DOWNLOAD_CONFIG.defaultFilename;
  }

  const sanitized = sanitizeFilename(filename);

  // Validate extension is safe
  const safeExtension = sanitizeExtension(sanitized, resolveAllowedExtensions(blob, sanitized));
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
    // Revoke later, not now: the browser reads the blob asynchronously, and
    // revoking it in the same tick can cancel a download that is still starting
    // (most visible with large PDFs). Headless Chromium also died between E2E
    // tests when the URL was revoked immediately after the click.
    window.setTimeout(() => URL.revokeObjectURL(url), CONST_DOWNLOAD_CONFIG.urlRevokeDelayMs);
  }
}

export async function downloadBlobsAsZip(
  blobs: { name: string; blob: Blob }[],
  zipFilename: string,
  options: { rejectInvalid?: boolean } = {}
): Promise<void> {
  // Sanitize each blob name to prevent path traversal in zip entries
  const entries = blobs.map(({ name, blob }) => {
    const sanitizedName = sanitizeFilename(name);
    const safeExtension = sanitizeExtension(sanitizedName, resolveAllowedExtensions(blob, sanitizedName));
    const baseName = sanitizedName.replace(/\.[^.]+$/, '');
    return { name: baseName + safeExtension, blob };
  });

  // Imported here, not at module scope, so JSZip stays out of the download path.
  const { createZipBlob } = await import('./zipUtils');
  const zipBlob = await createZipBlob(entries);
  downloadBlob(zipBlob, zipFilename, options);
}
