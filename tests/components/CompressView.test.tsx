import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompressView } from '../../src/components/features/CompressView/CompressView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

describe('CompressView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with header and dropzone', () => {
    render(<CompressView />);
    expect(screen.getByText('Compress PDF')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('shows dropzone when no file selected', () => {
    render(<CompressView />);
    expect(screen.getByText('Drag and drop a PDF file to compress')).toBeInTheDocument();
  });

  it('accepts file via dropzone', async () => {
    render(<CompressView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('shows quality options after file selected', async () => {
    render(<CompressView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('Compress PDF button is enabled after file selected', async () => {
    render(<CompressView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      const compressBtn = screen.getByRole('button', { name: 'Compress PDF' });
      expect(compressBtn).not.toBeDisabled();
    });
  });

  it('shows Preview button after file selected', async () => {
    render(<CompressView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    });
  });

  it('opens PreviewModal when Preview button clicked', async () => {
    render(<CompressView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const previewBtn = screen.getByRole('button', { name: 'Preview' });
    fireEvent.click(previewBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});