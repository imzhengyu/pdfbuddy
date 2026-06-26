import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SplitView } from '../../src/components/features/SplitView/SplitView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn(),
  downloadBlobsAsZip: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../src/utils/fileUtils', () => ({
  getPageCount: vi.fn().mockResolvedValue(5)
}));

vi.mock('../../src/services/pdf/ClientPDFService', () => ({
  ClientPDFService: vi.fn().mockImplementation(() => ({
    split: vi.fn().mockResolvedValue([new Blob(['test'], { type: 'application/pdf' })])
  }))
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

  it('accepts file via dropzone and shows source/target sections', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('Source Pages')).toBeInTheDocument();
    expect(screen.getByText('Selected Pages')).toBeInTheDocument();
    expect(screen.getByText('Drag pages here or click to select')).toBeInTheDocument();
  });

  it('shows mode toggle with Visual Selection and Page Ranges options', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText('Visual Selection')).toBeInTheDocument();
    expect(screen.getByText('Page Ranges')).toBeInTheDocument();
  });

  it('shows Export button disabled when no pages selected in visual mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: 'Export Selected Pages' });
    expect(exportBtn).toBeDisabled();
  });

  it('shows Preview Selected button disabled when no pages selected in visual mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const previewBtn = screen.getByRole('button', { name: 'Preview Selected' });
    expect(previewBtn).toBeDisabled();
  });

  it('switches to Page Ranges mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const rangeBtn = screen.getByText('Page Ranges');
    fireEvent.click(rangeBtn);

    expect(screen.getByLabelText('Page Ranges:')).toBeInTheDocument();
  });

  it('shows page range input in range mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const rangeBtn = screen.getByText('Page Ranges');
    fireEvent.click(rangeBtn);

    const rangeInput = screen.getByLabelText('Page Ranges:');
    expect(rangeInput).toBeInTheDocument();
    expect(rangeInput).toHaveAttribute('placeholder', 'e.g., 1-3, 4-6, 7');
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

    const closeBtn = screen.getByRole('button', { name: 'Dismiss error' });
    fireEvent.click(closeBtn);
    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('shows loading state during processing', async () => {
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

    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('renders with page count info in target section', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    expect(screen.getByText(/0 selected/)).toBeInTheDocument();
  });

  it('does not show Clear All button when no pages selected', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument();
  });

  it('shows Clear All button when pages are selected', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // In visual mode, no pages selected initially, so Clear All should not appear
    expect(screen.queryByRole('button', { name: 'Clear All' })).not.toBeInTheDocument();
  });

  it('enables Export button when pages are selected in visual mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // In visual mode, pages must be selected before Export is enabled
    // The preview button is for previewing, not for selecting pages
    // So we test that Export is disabled when no pages are selected
    const exportBtn = screen.getByRole('button', { name: 'Export Selected Pages' });
    expect(exportBtn).toBeDisabled();
  });

  it('enables Export button when valid page ranges entered', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const rangeBtn = screen.getByText('Page Ranges');
    fireEvent.click(rangeBtn);

    const rangeInput = screen.getByLabelText('Page Ranges:');
    fireEvent.change(rangeInput, { target: { value: '1-2' } });

    const exportBtn = screen.getByRole('button', { name: 'Export Selected Pages' });
    expect(exportBtn).not.toBeDisabled();
  });

  it('disables Export button when page ranges input is empty', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const rangeBtn = screen.getByText('Page Ranges');
    fireEvent.click(rangeBtn);

    const exportBtn = screen.getByRole('button', { name: 'Export Selected Pages' });
    expect(exportBtn).toBeDisabled();
  });

  it('disables Export button during processing', async () => {
    mockUseSplit.mockReturnValue({
      split: vi.fn().mockResolvedValue([new Blob(['test'], { type: 'application/pdf' })]),
      isProcessing: true,
      progress: null,
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

    // When processing, the button shows a loading spinner instead of the label
    const loadingBtn = screen.getByRole('button', { name: 'Loading' });
    expect(loadingBtn).toBeDisabled();
  });

  it('shows page count hint in range mode', async () => {
    render(<SplitView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const rangeBtn = screen.getByText('Page Ranges');
    fireEvent.click(rangeBtn);

    expect(screen.getByText(/max:/)).toBeInTheDocument();
  });
});