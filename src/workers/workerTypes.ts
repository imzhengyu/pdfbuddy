import { ProcessingProgress, PageRange, PageRotation, PageOrder, CompressionQuality } from '../services/pdf/types';
import type { ConvertToPDFOptions } from '../services/pdf/convertOperation';

// Re-export for worker convenience
export type { ProcessingProgress, ConvertToPDFOptions };

// Worker message types
export interface WorkerMessage {
  id: string;
  type: WorkerOperationType;
  payload: unknown;
}

export type WorkerOperationType =
  | 'merge'
  | 'split'
  | 'convert'
  | 'compress'
  | 'rotate'
  | 'reorganize';

export interface MergePayload {
  files: File[];
}

export interface SplitPayload {
  file: File;
  pageRanges: PageRange[];
}

export interface ConvertPayload {
  files: File[];
  options?: ConvertToPDFOptions;
}

export interface CompressPayload {
  file: File;
  quality: CompressionQuality;
}

export interface RotatePayload {
  file: File;
  rotations: PageRotation[];
}

export interface ReorganizePayload {
  file: File;
  newOrder: PageOrder[];
}

// Worker response types
export interface WorkerResponse {
  id: string;
  type: 'success' | 'error' | 'progress';
  result?: unknown;
  progress?: ProcessingProgress;
  error?: string;
}

export interface WorkerRequest {
  id: string;
  operation: WorkerOperationType;
  payload: unknown;
}

export interface WorkerProgressMessage {
  id: string;
  type: 'progress';
  progress: ProcessingProgress;
}

export interface WorkerSuccessMessage {
  id: string;
  type: 'success';
  result: unknown;
}

export interface WorkerErrorMessage {
  id: string;
  type: 'error';
  error: string;
}

export type WorkerOutgoingMessage = WorkerProgressMessage | WorkerSuccessMessage | WorkerErrorMessage;