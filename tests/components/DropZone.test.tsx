import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../../src/components/common/DropZone/DropZone';

describe('DropZone', () => {
  it('renders with default message', () => {
    render(<DropZone onFilesDropped={() => {}} accept={{ 'application/pdf': ['.pdf'] }} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<DropZone onFilesDropped={() => {}} accept={{ 'application/pdf': ['.pdf'] }} message="Drop PDFs here" />);
    expect(screen.getByText('Drop PDFs here')).toBeInTheDocument();
  });

  it('has correct accept attribute', () => {
    render(<DropZone onFilesDropped={() => {}} accept={{ 'application/pdf': ['.pdf'] }} />);
    const input = screen.getByTestId('dropzone').querySelector('input');
    expect(input).toHaveAttribute('accept');
    expect(input?.getAttribute('accept')).toContain('.pdf');
  });

  it('names the rejected file so the user knows which one failed (P2-2)', async () => {
    const onError = vi.fn();
    render(
      <DropZone
        onFilesDropped={() => {}}
        onError={onError}
        accept={{ 'application/pdf': ['.pdf'] }}
      />
    );

    const input = screen.getByTestId('dropzone').querySelector('input') as HTMLInputElement;
    const rejected = new File(['notes'], 'notes.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [rejected] } });

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0][0].message).toContain('notes.txt');
  });
});
