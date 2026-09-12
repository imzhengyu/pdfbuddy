/**
 * Error raised when pdf-lib cannot process a document, with the failure
 * classified so callers can give the user something actionable.
 */
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

/**
 * Runs a pdf-lib operation and translates its failures into a PDFLibError with
 * a user-facing message.
 *
 * There is no second engine to fall back to: a previous revision accepted a
 * `fallbackOperation` and a `_fallbackName` that no call site ever supplied,
 * left over from a pdfkit integration that was never implemented.
 */
export async function withPDFLibFallback<T>(pdfLibOperation: () => Promise<T>): Promise<T> {
  try {
    return await pdfLibOperation();
  } catch (error) {
    if (isPDFDict2Error(error)) {
      throw new PDFLibError(
        'This PDF has a non-standard structure that pdf-lib cannot process. The PDF may be corrupted or use advanced features not supported by pdf-lib.',
        'PDFDICT2',
        error instanceof Error ? error : undefined
      );
    }

    if (isEncryptionError(error)) {
      throw new PDFLibError(
        'This PDF is encrypted and cannot be processed. Please decrypt the PDF first.',
        'ENCRYPTED',
        error instanceof Error ? error : undefined
      );
    }

    throw new PDFLibError(
      error instanceof Error ? error.message : 'Unknown PDF processing error',
      'UNKNOWN',
      error instanceof Error ? error : undefined
    );
  }
}
