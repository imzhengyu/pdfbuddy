import { formatBytes } from './performance';
import { CONST_MIME_TYPES, CONST_SUPPORTED_IMAGE_MIME_TYPES, CONST_PDF_CONFIG } from '../config';
export { formatBytes as formatFileSize };

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function validatePDFFile(file: File): boolean {
  return file.type === CONST_MIME_TYPES.pdf || file.name.toLowerCase().endsWith(CONST_PDF_CONFIG.supportedExtensions[0]);
}

export function validateImageFile(file: File): boolean {
  return file.type.startsWith('image/') && CONST_SUPPORTED_IMAGE_MIME_TYPES.some(type => type === file.type);
}

export async function getPageCount(file: File): Promise<number> {
  const { PDFDocument } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return pdf.getPageCount();
}

export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

const fileIdMap = new WeakMap<File, string>();

/**
 * Returns a stable unique ID for a File object.
 * The ID is generated once per File instance and stored in a WeakMap,
 * so the same physical file object always returns the same ID without
 * mutating standard File properties.
 */
export function getFileId(file: File | null | undefined): string {
  if (!file) return '';
  let id = fileIdMap.get(file);
  if (!id) {
    id = crypto.randomUUID();
    fileIdMap.set(file, id);
  }
  return id;
}