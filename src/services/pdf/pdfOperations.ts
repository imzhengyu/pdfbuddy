import { PDFDocument } from 'pdf-lib';
import { ProcessingProgress } from './types';
import { CONST_MIME_TYPES } from '../../config';

export type ProgressCallback = (progress: ProcessingProgress) => void;

/**
 * Loads a PDF from an ArrayBuffer.
 *
 * Encryption is tolerated so we can still read documents whose permissions
 * allow it; anything pdf-lib genuinely cannot parse surfaces as an error.
 */
export async function loadPDFFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

/**
 * Serialises a document to the PDF Blob shape every operation returns.
 *
 * This used to be copy-pasted into all five operation modules as
 * `new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' })`.
 */
export async function savePDFToBlob(pdf: PDFDocument, options: object = {}): Promise<Blob> {
  const bytes = await pdf.save(options);
  return new Blob([new Uint8Array(bytes)], { type: CONST_MIME_TYPES.pdf });
}