import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});