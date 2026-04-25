import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SplitView } from '../../src/components/features/SplitView/SplitView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn(),
  downloadBlobsAsZip: vi.fn().mockResolvedValue(undefined)
}));

const mockUseSplit = vi.fn();

vi.mock('../../src/hooks/useSplit', () => ({
  useSplit: () => mockUseSplit()
}));

describe('SplitView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSplit.mockReturnValue({
      split: vi.fn().mockResolvedValue([new Blob(['test'], { type: 'application/pdf' })]),
      isProcessing: false,
      progress: null,
      error: null,
      clearError: vi.fn()
    });
  });

  it('renders with header and dropzone', () => {
    render(<SplitView />);
    expect(screen.getByText('Split PDF')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('shows dropzone when no file is selected', () => {
    render(<SplitView />);
    expect(screen.getByText('Drag and drop a PDF file to split')).toBeInTheDocument();
  });

  it('accepts file via dropzone', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('Split PDF button is disabled when no page ranges', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      const splitBtn = screen.getByRole('button', { name: 'Split PDF' });
      expect(splitBtn).toBeDisabled();
    });
  });

  it('Split PDF button is enabled when page ranges entered', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const pageRangesInput = screen.getByLabelText('Page Ranges:');
    fireEvent.change(pageRangesInput, { target: { value: '1-3' } });

    const splitBtn = screen.getByRole('button', { name: 'Split PDF' });
    expect(splitBtn).not.toBeDisabled();
  });

  it('renders with loading state', async () => {
    mockUseSplit.mockReturnValue({
      split: vi.fn().mockResolvedValue([new Blob(['test'], { type: 'application/pdf' })]),
      isProcessing: true,
      progress: { current: 1, total: 2, percent: 50 },
      error: null,
      clearError: vi.fn()
    });

    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('displays error and allows clearing it', async () => {
    const clearErrorMock = vi.fn();
    mockUseSplit.mockReturnValue({
      split: vi.fn().mockResolvedValue(null),
      isProcessing: false,
      progress: null,
      error: 'Split failed',
      clearError: clearErrorMock
    });

    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Split failed')).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeBtn);
    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('Change File button resets state', async () => {
    render(<SplitView />);

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
      expect(screen.getByText('Drag and drop a PDF file to split')).toBeInTheDocument();
    });
  });

  it('shows Preview Pages button after file selected', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Preview Pages' })).toBeInTheDocument();
    });
  });

  it('opens PreviewModal when Preview Pages button clicked', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const previewBtn = screen.getByRole('button', { name: 'Preview Pages' });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});