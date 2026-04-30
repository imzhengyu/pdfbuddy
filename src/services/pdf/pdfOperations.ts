import { PDFDocument, PDFPage } from 'pdf-lib';
import { ProcessingProgress } from './types';

export type ProgressCallback = (progress: ProcessingProgress) => void;

export function createProgressCallback(
  current: number,
  total: number
): ProgressCallback {
  return (progress: ProcessingProgress) => {
    progress.current = current;
    progress.total = total;
    progress.percent = Math.round((current / total) * 100);
  };
}

export async function loadPDFFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<PDFDocument> {
  return PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

export const loadPDF = loadPDFFromArrayBuffer;

export function savePDF(pdf: PDFDocument): Promise<Blob> {
  return savePDFWithOptions(pdf, {});
}

export function savePDFWithOptions(pdf: PDFDocument, options: object): Promise<Blob> {
  return pdf.save(options).then(bytes =>
    new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
  );
}

export function getPDFPageCount(pdf: PDFDocument): number {
  return pdf.getPageCount();
}

export function getPDFPages(pdf: PDFDocument): PDFPage[] {
  return pdf.getPages();
}

export async function copyPages(
  sourcePdf: PDFDocument,
  targetPdf: PDFDocument,
  indices: number[]
): Promise<PDFPage[]> {
  return targetPdf.copyPages(sourcePdf, indices);
}

export function addPage(pdf: PDFDocument, page: PDFPage): void {
  pdf.addPage(page);
}

export function createPDF(): Promise<PDFDocument> {
  return PDFDocument.create();
}