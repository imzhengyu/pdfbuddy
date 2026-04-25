import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RotateView } from '../../src/components/features/RotateView/RotateView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

describe('RotateView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with header and dropzone', () => {
    render(<RotateView />);
    expect(screen.getByText('Rotate PDF')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('shows dropzone when no file selected', () => {
    render(<RotateView />);
    expect(screen.getByText('Drag and drop a PDF file to rotate')).toBeInTheDocument();
  });

  it('accepts file via dropzone', async () => {
    render(<RotateView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('shows hint about selecting pages', async () => {
    render(<RotateView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('Click pages to select them')).toBeInTheDocument();
    });
  });

  it('shows Preview PDF button after file selected', async () => {
    render(<RotateView />);

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
    render(<RotateView />);

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
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});