import { CompressionQuality } from './types';
import { validatePDF } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';
import { CONST_ERROR_MESSAGES, CONST_MIME_TYPES } from '../../config';

export async function compressPdf(
  file: File,
  quality: CompressionQuality,
  onProgress?: ProgressCallback
): Promise<Blob> {
  // Validate PDF structure using full validation
  const validationResult = await validatePDF(file, 'full');
  if (!validationResult.valid) {
    throw new Error(CONST_ERROR_MESSAGES.invalidPdf(file.name, validationResult.errors.join('; ')));
  }

  onProgress?.({ current: 0, total: 1, percent: 50 });

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await withPDFLibFallback(
    async () => loadPDFFromArrayBuffer(arrayBuffer),
    undefined,
    'PDFKit compress'
  );

  // pdf-lib only supports useObjectStreams for compression
  // Low quality would ideally disable this, but pdf-lib doesn't support fine-grained control
  const pdfBytes = await pdf.save({
    useObjectStreams: quality !== 'low'
  });

  onProgress?.({ current: 1, total: 1, percent: 100 });

  return new Blob([new Uint8Array(pdfBytes)], { type: CONST_MIME_TYPES.pdf });
}