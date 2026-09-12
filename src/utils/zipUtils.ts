/**
 * Archive creation.
 *
 * Kept in its own module on purpose: `downloadBlob` is on the critical path of
 * every view, while archives are only needed when exporting several pages. This
 * module is imported dynamically so JSZip ends up in its own lazily loaded
 * chunk instead of next to the download helper.
 */

export interface ZipEntry {
  /** Entry name inside the archive, already sanitized by the caller. */
  name: string;
  blob: Blob;
}

/** Builds a ZIP archive from the given entries. */
export async function createZipBlob(entries: ZipEntry[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const entry of entries) {
    zip.file(entry.name, entry.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}
