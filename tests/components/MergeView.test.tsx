import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MergeView } from '../../src/components/features/MergeView/MergeView';
import { uploadFileToDropzone } from '../utils/testHelpers';
import { CONST_LIMITS_CONFIG } from '../../src/config';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

const { mergeMock } = vi.hoisted(() => ({ mergeMock: vi.fn() }));

vi.mock('../../src/hooks/useMerge', () => ({
  useMerge: () => ({
    merge: mergeMock,
    isProcessing: false,
    progress: null,
    error: null,
    clearError: vi.fn()
  })
}));

describe('MergeView', () => {
  describe('Add More Files', () => {
    beforeEach(() => {
      mergeMock.mockReset();
      mergeMock.mockResolvedValue(new Blob(['mock pdf'], { type: 'application/pdf' }));
    });

    const createFile = (name: string) => {
      return new File(['test'], name, { type: 'application/pdf' });
    };

    const clickButton = (name: string) => {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name }));
      });
    };

    it('shows Add More Files button after adding first file', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });
    });

    it('clicking Add More Files shows DropZone for adding more files', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });

      clickButton('Add More Files');

      await waitFor(() => {
        expect(screen.getByText('Add more PDF files')).toBeInTheDocument();
      });
    });

    it('adding more files via DropZone increases file count', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test1.pdf'));

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });

      clickButton('Add More Files');

      await waitFor(() => {
        expect(screen.getByText('Add more PDF files')).toBeInTheDocument();
      });

      await uploadFileToDropzone(document.body, createFile('test2.pdf'));

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.pdf')).toBeInTheDocument();
      });
    });

    it('merge button is disabled when less than 2 files', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test.pdf'));

      await waitFor(() => {
        const mergeBtn = screen.getByRole('button', { name: 'Merge 1 Files' });
        expect(mergeBtn).toBeDisabled();
      });
    });

    it('merge button is enabled when 2 or more files', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test1.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });

      clickButton('Add More Files');

      await waitFor(() => {
        expect(screen.getByText('Add more PDF files')).toBeInTheDocument();
      });

      await uploadFileToDropzone(document.body, createFile('test2.pdf'));

      await waitFor(() => {
        const mergeBtn = screen.getByRole('button', { name: 'Merge 2 Files' });
        expect(mergeBtn).toBeEnabled();
      });
    });

    it('files can be reordered via drag and drop', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('file1.pdf'));

      await waitFor(() => {
        expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      });

      clickButton('Add More Files');

      await uploadFileToDropzone(document.body, createFile('file2.pdf'));

      await waitFor(() => {
        expect(screen.getByText('file1.pdf')).toBeInTheDocument();
        expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      });

      const fileItems = document.querySelectorAll('[draggable=true]');
      expect(fileItems.length).toBe(2);
    });

    it('shows Preview Files button after adding files', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Preview Files' })).toBeInTheDocument();
      });
    });

    it('opens PreviewModal when Preview Files button clicked', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('test.pdf'));

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      clickButton('Preview Files');

      await waitFor(() => {
        expect(screen.getByTestId('preview-modal-header')).toBeInTheDocument();
      });
    });

    it('previews the merged document, not just the first file', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('first.pdf'));

      await waitFor(() => {
        expect(screen.getByText('first.pdf')).toBeInTheDocument();
      });

      clickButton('Add More Files');
      await waitFor(() => {
        expect(screen.getByText('Add more PDF files')).toBeInTheDocument();
      });
      await uploadFileToDropzone(document.body, createFile('second.pdf'));

      await waitFor(() => {
        expect(screen.getByText('second.pdf')).toBeInTheDocument();
      });

      clickButton('Preview Files');

      await waitFor(() => {
        expect(screen.getByTestId('preview-modal-header')).toBeInTheDocument();
      });

      expect(mergeMock).toHaveBeenCalledTimes(1);
      const mergedNames = mergeMock.mock.calls[0][0].map((file: File) => file.name);
      expect(mergedNames).toEqual(['first.pdf', 'second.pdf']);
    });

    it('rebuilds an open preview when the files are reordered', async () => {
      render(<MergeView />);

      await uploadFileToDropzone(document.body, createFile('first.pdf'));
      await waitFor(() => expect(screen.getByText('first.pdf')).toBeInTheDocument());

      clickButton('Add More Files');
      await waitFor(() => expect(screen.getByText('Add more PDF files')).toBeInTheDocument());
      await uploadFileToDropzone(document.body, createFile('second.pdf'));
      await waitFor(() => expect(screen.getByText('second.pdf')).toBeInTheDocument());

      clickButton('Preview Files');
      await waitFor(() => expect(screen.getByTestId('preview-modal-header')).toBeInTheDocument());
      expect(mergeMock).toHaveBeenCalledTimes(1);

      // Drag the second file onto the first: the preview must follow the new
      // order instead of closing or keeping the old one.
      const items = document.querySelectorAll('[draggable=true]');
      expect(items.length).toBe(2);

      // Separate acts: the drag handlers store state between events, and
      // batching them together leaves dragOverIndex unset.
      act(() => {
        fireEvent.dragStart(items[1]);
      });
      act(() => {
        fireEvent.dragOver(items[0]);
      });
      act(() => {
        fireEvent.dragEnd(items[1]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('preview-modal-header')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mergeMock).toHaveBeenCalledTimes(2);
      });

      const reorderedNames = mergeMock.mock.calls[1][0].map((file: File) => file.name);
      expect(reorderedNames).toEqual(['second.pdf', 'first.pdf']);
    });

    it('caps how many files it will accept at once', async () => {
      render(<MergeView />);

      const limit = CONST_LIMITS_CONFIG.maxFilesPerOperation;
      const files = Array.from({ length: limit + 1 }, (_, index) =>
        createFile(`file-${index}.pdf`)
      );

      const input = screen.getByTestId('dropzone').querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Up to ${limit} files`))).toBeInTheDocument();
      });
      expect(document.querySelectorAll('[draggable=true]')).toHaveLength(limit);
    });
  });
});
