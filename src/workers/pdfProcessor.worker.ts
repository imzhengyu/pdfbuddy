/// <reference lib="webworker" />

import { PDFDocument } from 'pdf-lib';
import {
  WorkerRequest,
  WorkerOutgoingMessage,
  MergePayload,
  SplitPayload,
  ConvertPayload,
  ProcessingProgress,
} from './workerTypes';
import { convertImagesToPdf } from '../services/pdf/convertOperation';

let cancelled = false;

function sendProgress(id: string, progress: ProcessingProgress): void {
  const msg: WorkerOutgoingMessage = { id, type: 'progress', progress };
  self.postMessage(msg);
}

function sendSuccess(id: string, result: unknown): void {
  const msg: WorkerOutgoingMessage = { id, type: 'success', result };
  self.postMessage(msg);
}

function sendError(id: string, error: string): void {
  const msg: WorkerOutgoingMessage = { id, type: 'error', error };
  self.postMessage(msg);
}

async function mergePdfs(payload: MergePayload, id: string): Promise<void> {
  const { files } = payload;

  if (files.length < 2) {
    sendError(id, 'At least 2 files are required to merge');
    return;
  }

  const mergedPdf = await PDFDocument.create();
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    if (cancelled) {
      sendError(id, 'Operation cancelled');
      return;
    }

    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));

    sendProgress(id, {
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  sendSuccess(id, blob);
}

async function splitPdf(payload: SplitPayload, id: string): Promise<void> {
  const { file, pageRanges } = payload;

  if (pageRanges.length === 0) {
    sendError(id, 'At least one page range is required');
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdf.getPageCount();

  // Validate ranges
  for (const range of pageRanges) {
    if (range.start < 1 || range.start > pageCount) {
      sendError(id, `Invalid page range: ${range.start}`);
      return;
    }
    const end = range.end === -1 ? pageCount : range.end;
    if (end < range.start || end > pageCount) {
      sendError(id, `Invalid page range: ${range.end}`);
      return;
    }
  }

  const results: Blob[] = [];
  const total = pageRanges.length;

  for (let i = 0; i < pageRanges.length; i++) {
    if (cancelled) {
      sendError(id, 'Operation cancelled');
      return;
    }

    const range = pageRanges[i];
    const newPdf = await PDFDocument.create();
    const end = range.end === -1 ? pageCount : range.end;

    for (let pageIdx = range.start - 1; pageIdx < end; pageIdx++) {
      const [page] = await newPdf.copyPages(pdf, [pageIdx]);
      newPdf.addPage(page);
    }

    const pdfBytes = await newPdf.save();
    results.push(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));

    sendProgress(id, {
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });
  }

  sendSuccess(id, results);
}

async function convertToPDF(payload: ConvertPayload, id: string): Promise<void> {
  const { files, options } = payload;

  if (files.length === 0) {
    sendError(id, 'At least one image is required');
    return;
  }

  try {
    const blob = await convertImagesToPdf(
      files,
      (progress) => sendProgress(id, progress),
      options
    );
    sendSuccess(id, blob);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(id, message);
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, operation, payload } = event.data;
  cancelled = false;

  try {
    switch (operation) {
      case 'merge':
        await mergePdfs(payload as MergePayload, id);
        break;
      case 'split':
        await splitPdf(payload as SplitPayload, id);
        break;
      case 'convert':
        await convertToPDF(payload as ConvertPayload, id);
        break;
      default:
        sendError(id, `Unknown operation: ${operation}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(id, message);
  }
};

// Handle cancellation messages
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'cancel') {
    cancelled = true;
  }
});

export {};