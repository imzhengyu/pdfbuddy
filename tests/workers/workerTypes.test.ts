import { describe, it, expect } from 'vitest';
import {
  WorkerMessage,
  WorkerRequest,
  WorkerOutgoingMessage,
  MergePayload,
  SplitPayload,
} from '../../src/workers/workerTypes';

describe('workerTypes', () => {
  describe('WorkerRequest', () => {
    it('has correct structure for merge request', () => {
      const request: WorkerRequest = {
        id: 'test-id',
        operation: 'merge',
        payload: { files: [] },
      };

      expect(request.id).toBe('test-id');
      expect(request.operation).toBe('merge');
      expect(request.payload).toEqual({ files: [] });
    });

    it('has correct structure for split request', () => {
      const request: WorkerRequest = {
        id: 'split-id',
        operation: 'split',
        payload: { file: new File(['test'], 'test.pdf'), pageRanges: [{ start: 1, end: 5 }] },
      };

      expect(request.id).toBe('split-id');
      expect(request.operation).toBe('split');
    });
  });

  describe('WorkerOutgoingMessage union types', () => {
    it('can represent progress message', () => {
      const progressMsg: WorkerOutgoingMessage = {
        id: 'test-id',
        type: 'progress',
        progress: { current: 2, total: 5, percent: 40 },
      };

      expect(progressMsg.type).toBe('progress');
      expect(progressMsg.progress?.percent).toBe(40);
    });

    it('can represent success message', () => {
      const successMsg: WorkerOutgoingMessage = {
        id: 'test-id',
        type: 'success',
        result: new Blob(['pdf content']),
      };

      expect(successMsg.type).toBe('success');
      expect(successMsg.result).toBeInstanceOf(Blob);
    });

    it('can represent error message', () => {
      const errorMsg: WorkerOutgoingMessage = {
        id: 'test-id',
        type: 'error',
        error: 'Something went wrong',
      };

      expect(errorMsg.type).toBe('error');
      expect(errorMsg.error).toBe('Something went wrong');
    });
  });

  describe('MergePayload', () => {
    it('contains files array', () => {
      const files = [
        new File(['content1'], 'file1.pdf'),
        new File(['content2'], 'file2.pdf'),
      ];
      const payload: MergePayload = { files };

      expect(payload.files).toHaveLength(2);
      expect(payload.files[0].name).toBe('file1.pdf');
    });
  });

  describe('SplitPayload', () => {
    it('contains file and pageRanges', () => {
      const file = new File(['content'], 'test.pdf');
      const ranges = [{ start: 1, end: 3 }, { start: 5, end: -1 }];
      const payload: SplitPayload = { file, pageRanges: ranges };

      expect(payload.file.name).toBe('test.pdf');
      expect(payload.pageRanges).toHaveLength(2);
      expect(payload.pageRanges[1].end).toBe(-1);
    });
  });
});