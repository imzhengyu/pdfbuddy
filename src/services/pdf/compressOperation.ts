import { CompressionQuality } from './types';
import { validatePDFFile } from './pdfValidation';
import { ProgressCallback, loadPDFFromArrayBuffer } from './pdfOperations';
import { withPDFLibFallback } from './pdfFallback';

export async function compressPdf(
  file: File,
  _quality: CompressionQuality,
  onProgress?: ProgressCallback
): Promise<Blob> {
  validatePDFFile(file);

  onProgress?.({ current: 0, total: 1, percent: 50 });

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await withPDFLibFallback(
    async () => loadPDFFromArrayBuffer(arrayBuffer),
    undefined,
    'PDFKit compress'
  );

  const pdfBytes = await pdf.save({
    useObjectStreams: true
  });

  onProgress?.({ current: 1, total: 1, percent: 100 });

  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
}