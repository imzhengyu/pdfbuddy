import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvertView } from '../../src/components/features/ConvertView/ConvertView';

vi.mock('../../src/utils/downloadUtils', () => ({
  downloadBlob: vi.fn()
}));

describe('ConvertView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with header and dropzone', () => {
    render(<ConvertView />);
    expect(screen.getByText('Convert to PDF')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('shows dropzone when no files', () => {
    render(<ConvertView />);
    expect(screen.getByText('Drag and drop images here to convert to PDF')).toBeInTheDocument();
  });

  it('accepts image file via dropzone', async () => {
    render(<ConvertView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument();
    });
  });

  it('shows convert button after adding image', async () => {
    render(<ConvertView />);

    const input = screen.getByTestId('dropzone').querySelector('input');
    if (input) {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText(/Convert.*1 Image.*to PDF/)).toBeInTheDocument();
    });
  });
});