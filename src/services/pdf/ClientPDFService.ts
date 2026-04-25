import { IPDFService, PageRange, PageRotation, PageOrder, ProcessingProgress, CompressionQuality, ConversionOptions, PDFProcessingError } from './types';

export class ClientPDFService implements IPDFService {
  async merge(files: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (files.length < 2) {
      throw new PDFProcessingError(
        'At least 2 files are required to merge',
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        throw new PDFProcessingError(
          `${file.name} is not a valid PDF file`,
          'FILE_VALIDATION'
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));

      onProgress?.({
        current: i + 1,
        total: files.length,
        percent: Math.round(((i + 1) / files.length) * 100)
      });
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async split(file: File, pageRanges: PageRange[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageCount = pdf.getPageCount();

    for (const range of pageRanges) {
      if (range.start < 1 || range.start > pageCount) {
        throw new PDFProcessingError(
          `Invalid page number: ${range.start}. File has ${pageCount} pages.`,
          'PAGE_RANGE'
        );
      }
      const end = range.end === -1 ? pageCount : range.end;
      if (end < range.start || end > pageCount) {
        throw new PDFProcessingError(
          `Invalid page range: ${range.start}-${range.end}`,
          'PAGE_RANGE'
        );
      }
    }

    const results: Blob[] = [];
    for (let i = 0; i < pageRanges.length; i++) {
      const range = pageRanges[i];
      const newPdf = await PDFDocument.create();
      const end = range.end === -1 ? pageCount : range.end;

      for (let pageIdx = range.start - 1; pageIdx < end; pageIdx++) {
        const [page] = await newPdf.copyPages(pdf, [pageIdx]);
        newPdf.addPage(page);
      }

      const pdfBytes = await newPdf.save();
      results.push(new Blob([pdfBytes], { type: 'application/pdf' }));

      onProgress?.({
        current: i + 1,
        total: pageRanges.length,
        percent: Math.round(((i + 1) / pageRanges.length) * 100)
      });
    }

    return results;
  }

  async compress(file: File, quality: CompressionQuality, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    onProgress?.({ current: 0, total: 1, percent: 50 });

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);

    const pdfBytes = await pdf.save({
      useObjectStreams: true
    });

    onProgress?.({ current: 1, total: 1, percent: 100 });

    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async rotate(file: File, rotations: PageRotation[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    for (const rotation of rotations) {
      if (rotation.pageIndex < 0 || rotation.pageIndex >= pages.length) {
        throw new PDFProcessingError(
          `Invalid page index: ${rotation.pageIndex}`,
          'PAGE_RANGE'
        );
      }

      const page = pages[rotation.pageIndex];
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + rotation.degrees) % 360;
      page.setRotation(newRotation);

      onProgress?.({
        current: rotation.pageIndex + 1,
        total: rotations.length,
        percent: Math.round(((rotation.pageIndex + 1) / rotations.length) * 100)
      });
    }

    const pdfBytes = await pdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async convertToImages(file: File, options: ConversionOptions, onProgress?: (progress: ProcessingProgress) => void): Promise<Blob[]> {
    // PDF to image conversion requires canvas/pdf.js which is heavy
    // For MVP, this throws an error indicating backend is needed
    throw new PDFProcessingError(
      'PDF to image conversion requires the backend service. This feature is coming soon.',
      'PROCESSING',
      'Use the backend API for PDF to image conversion'
    );
  }

  async convertToPDF(imageFiles: File[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib');
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (!file.type.startsWith('image/')) {
        throw new PDFProcessingError(
          `${file.name} is not an image file`,
          'FORMAT'
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      let image;

      if (file.type === 'image/png') {
        image = await mergedPdf.embedPng(arrayBuffer);
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await mergedPdf.embedJpg(arrayBuffer);
      } else {
        throw new PDFProcessingError(
          `Unsupported image format: ${file.type}. Only PNG and JPEG are supported.`,
          'FORMAT'
        );
      }

      const page = mergedPdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });

      onProgress?.({
        current: i + 1,
        total: imageFiles.length,
        percent: Math.round(((i + 1) / imageFiles.length) * 100)
      });
    }

    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  async reorganize(file: File, newOrder: PageOrder[], onProgress?: (progress: ProcessingProgress) => void): Promise<Blob> {
    if (file.type !== 'application/pdf') {
      throw new PDFProcessingError(
        `${file.name} is not a valid PDF file`,
        'FILE_VALIDATION'
      );
    }

    const { PDFDocument } = await import('pdf-lib');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pageCount = pdf.getPageCount();

    const validIndices = new Set<number>();
    for (const order of newOrder) {
      if (order.originalIndex < 0 || order.originalIndex >= pageCount) {
        throw new PDFProcessingError(
          `Invalid page index: ${order.originalIndex}`,
          'PAGE_RANGE'
        );
      }
      validIndices.add(order.originalIndex);
    }

    if (validIndices.size !== pageCount) {
      throw new PDFProcessingError(
        'All pages must be included in the new order',
        'PAGE_RANGE'
      );
    }

    const newPdf = await PDFDocument.create();
    const sortedOrder = [...newOrder].sort((a, b) => a.newIndex - b.newIndex);

    for (let i = 0; i < sortedOrder.length; i++) {
      const [page] = await newPdf.copyPages(pdf, [sortedOrder[i].originalIndex]);
      newPdf.addPage(page);

      onProgress?.({
        current: i + 1,
        total: sortedOrder.length,
        percent: Math.round(((i + 1) / sortedOrder.length) * 100)
      });
    }

    const pdfBytes = await newPdf.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }
}