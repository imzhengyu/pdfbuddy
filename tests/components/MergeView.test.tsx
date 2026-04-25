import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MergeView } from '../../src/components/features/MergeView/MergeView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

describe('MergeView', () => {
  describe('Add More Files', () => {
    const createFile = (name: string) => {
      return new File(['test'], name, { type: 'application/pdf' });
    };

    const uploadFile = (input: HTMLInputElement | null, file: File) => {
      if (!input) return;
      act(() => {
        fireEvent.change(input, {
          target: { files: [file] }
        });
      });
    };

    const clickButton = (name: string) => {
      act(() => {
        fireEvent.click(screen.getByRole('button', { name }));
      });
    };

    it('shows Add More Files button after adding first file', async () => {
      render(<MergeView />);

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('test.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });
    });

    it('clicking Add More Files shows DropZone for adding more files', async () => {
      render(<MergeView />);

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('test.pdf'));

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

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('test1.pdf'));

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

      const addMoreInput = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(addMoreInput, createFile('test2.pdf'));

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.pdf')).toBeInTheDocument();
      });
    });

    it('merge button is disabled when less than 2 files', async () => {
      render(<MergeView />);

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('test.pdf'));

      await waitFor(() => {
        const mergeBtn = screen.getByRole('button', { name: 'Merge 1 Files' });
        expect(mergeBtn).toBeDisabled();
      });
    });

    it('merge button is enabled when 2 or more files', async () => {
      render(<MergeView />);

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('test1.pdf'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add More Files' })).toBeInTheDocument();
      });

      clickButton('Add More Files');

      await waitFor(() => {
        expect(screen.getByText('Add more PDF files')).toBeInTheDocument();
      });

      const addMoreInput = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(addMoreInput, createFile('test2.pdf'));

      await waitFor(() => {
        const mergeBtn = screen.getByRole('button', { name: 'Merge 2 Files' });
        expect(mergeBtn).toBeEnabled();
      });
    });

    it('files can be reordered via drag and drop', async () => {
      render(<MergeView />);

      const input = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(input, createFile('file1.pdf'));

      await waitFor(() => {
        expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      });

      clickButton('Add More Files');

      const addMoreInput = screen.getByTestId('dropzone').querySelector('input');
      uploadFile(addMoreInput, createFile('file2.pdf'));

      await waitFor(() => {
        expect(screen.getByText('file1.pdf')).toBeInTheDocument();
        expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      });

      const fileItems = document.querySelectorAll('[draggable=true]');
      expect(fileItems.length).toBe(2);
    });
  });
});