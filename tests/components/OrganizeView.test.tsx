import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrganizeView, movePage } from '../../src/components/features/OrganizeView/OrganizeView';
import { getPageCount } from '../../src/utils/fileUtils';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

vi.mock('../../src/utils/fileUtils', () => ({
  getPageCount: vi.fn().mockResolvedValue(3),
  getFileId: vi.fn().mockReturnValue('mock-file-id')
}));

const mockUseOrganize = vi.fn();

vi.mock('../../src/hooks/useOrganize', () => ({
  useOrganize: () => mockUseOrganize()
}));

describe('OrganizeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOrganize.mockReturnValue({
      reorganize: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/pdf' })),
      isProcessing: false,
      progress: null,
      error: null,
      clearError: vi.fn()
    });
  });

  it('renders with header and dropzone', () => {
    render(<OrganizeView />);
    expect(screen.getByText('Organize PDF')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('moves a dragged page to the position it was dropped on (B-1)', () => {
    // Original page 0 is dragged onto original page 2: the order array is
    // indexed by position, so a naive splice by page index would corrupt it.
    expect(movePage([0, 1, 2], 0, 2)).toEqual([1, 2, 0]);
    // Page 1 sits at position 2 of [2, 0, 1]; dragging it onto page 2 (position
    // 0) puts it first.
    expect(movePage([2, 0, 1], 1, 2)).toEqual([1, 2, 0]);
    expect(movePage([0, 1, 2], 1, 1)).toEqual([0, 1, 2]);
    expect(movePage([0, 1, 2], 9, 1)).toEqual([0, 1, 2]);
  });

  it('reports a page-count failure instead of blaming page deletion (B-7)', async () => {
    vi.mocked(getPageCount).mockRejectedValueOnce(new Error('unreadable'));

    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'broken.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/Could not read the pages of "broken.pdf"/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Download Organized PDF' })).toBeDisabled();
    expect(screen.queryByText('No pages left after deletion')).toBeNull();
  });

  it('shows dropzone when no file selected', () => {
    render(<OrganizeView />);
    expect(screen.getByText('Drag and drop a PDF file to organize')).toBeInTheDocument();
  });

  it('accepts file via dropzone', async () => {
    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('displays error when error occurs', async () => {
    const clearErrorMock = vi.fn();
    mockUseOrganize.mockReturnValue({
      reorganize: vi.fn().mockResolvedValue(null),
      isProcessing: false,
      progress: null,
      error: 'Organize failed',
      clearError: clearErrorMock
    });

    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Organize failed')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: 'Dismiss error' });
    fireEvent.click(closeBtn);
    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('Change File button resets state', async () => {
    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const changeBtn = screen.getByRole('button', { name: 'Change File' });
    fireEvent.click(changeBtn);

    await waitFor(() => {
      expect(screen.getByText('Drag and drop a PDF file to organize')).toBeInTheDocument();
    });
  });

  it('shows Preview PDF button after file selected', async () => {
    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Preview PDF' })).toBeInTheDocument();
    });
  });

  it('opens PreviewModal when Preview PDF button clicked', async () => {
    render(<OrganizeView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const previewBtn = screen.getByRole('button', { name: 'Preview PDF' });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByTestId('preview-modal-header')).toBeInTheDocument();
    });
  });
});
