import { PDFDocument, PDFPage } from 'pdf-lib';

export class PDFLibError extends Error {
  constructor(
    message: string,
    public code: 'PDFDICT2' | 'ENCRYPTED' | 'CORRUPT' | 'UNKNOWN',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PDFLibError';
  }
}

export function isPDFLibError(error: unknown): error is PDFLibError {
  return error instanceof PDFLibError;
}

export function isPDFDict2Error(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('PDFDict2') ||
           error.message.includes('Expected instance of PDFDict2');
  }
  return false;
}

export function isEncryptionError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('encrypted') ||
           error.message.includes('Encryption');
  }
  return false;
}

export async function withPDFLibFallback<T>(
  pdfLibOperation: () => Promise<T>,
  fallbackOperation?: () => Promise<T>,
  fallbackName?: string
): Promise<T> {
  try {
    return await pdfLibOperation();
  } catch (error) {
    if (isPDFDict2Error(error)) {
      console.warn(`[PDF Fallback] pdf-lib failed with PDFDict2 error. ${fallbackName ? `Attempting ${fallbackName}...` : 'No fallback available.'}`);
      if (fallbackOperation) {
        return await fallbackOperation();
      }
      throw new PDFLibError(
        'This PDF has a non-standard structure that pdf-lib cannot process. The PDF may be corrupted or use advanced features not supported by pdf-lib.',
        'PDFDICT2',
        error instanceof Error ? error : undefined
      );
    }

    if (isEncryptionError(error)) {
      console.warn(`[PDF Fallback] pdf-lib failed with encryption error. Retrying with ignoreEncryption...`);
      return await pdfLibOperation();
    }

    console.error('[PDF Fallback] Unknown error:', error);
    throw new PDFLibError(
      error instanceof Error ? error.message : 'Unknown PDF processing error',
      'UNKNOWN',
      error instanceof Error ? error : undefined
    );
  }
}

export async function loadPDFWithFallback(
  file: File,
  fallbackLoad?: (file: File) => Promise<PDFDocument>
): Promise<PDFDocument> {
  return withPDFLibFallback(
    async () => {
      const arrayBuffer = await file.arrayBuffer();
      return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    },
    fallbackLoad ? () => fallbackLoad(file) : undefined,
    'PDFKit fallback'
  );
}

export async function copyPagesWithFallback(
  sourcePdf: PDFDocument,
  targetPdf: PDFDocument,
  indices: number[]
): Promise<PDFPage[]> {
  return withPDFLibFallback(
    async () => targetPdf.copyPages(sourcePdf, indices),
    undefined,
    'PDFKit copyPages fallback'
  );
}