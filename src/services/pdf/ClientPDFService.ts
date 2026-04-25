import { IPDFService, PageRange, PageRotation, PageOrder, ProcessingProgress, CompressionQuality } from './types';
import { mergePdfs } from './mergeOperation';
import { splitPdf } from './splitOperation';
import { compressPdf } from './compressOperation';
import { rotatePdf } from './rotateOperation';
import { convertImagesToPdf, pdfToImagesNotSupported } from './convertOperation';
import { reorganizePdf } from './reorganizeOperation';

export class ClientPDFService implements IPDFService {
  async merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return mergePdfs(files, onProgress);
  }

  async split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    return splitPdf(file, pageRanges, onProgress);
  }

  async compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return compressPdf(file, quality, onProgress);
  }

  async rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return rotatePdf(file, rotations, onProgress);
  }

  async convertToImages(_file: File, _options: never, _onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    return pdfToImagesNotSupported();
  }

  async convertToPDF(imageFiles: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return convertImagesToPdf(imageFiles, onProgress);
  }

  async reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    return reorganizePdf(file, newOrder, onProgress);
  }
}