export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadBlobsAsZip(blobs: { name: string; blob: Blob }[], zipFilename: string): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const { name, blob } of blobs) {
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, zipFilename);
}