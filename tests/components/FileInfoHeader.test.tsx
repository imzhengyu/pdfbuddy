import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileInfoHeader } from '../../src/components/common/FileInfoHeader';

describe('FileInfoHeader', () => {
  it('renders file name', () => {
    render(<FileInfoHeader fileName="test.pdf" />);
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('renders extra info', () => {
    render(<FileInfoHeader fileName="test.pdf" info="1.2 MB" />);
    expect(screen.getByText('(1.2 MB)')).toBeInTheDocument();
  });

  it('calls onChangeFile when change button clicked', () => {
    const onChangeFile = vi.fn();
    render(<FileInfoHeader fileName="test.pdf" onChangeFile={onChangeFile} />);
    fireEvent.click(screen.getByRole('button', { name: /Change File/i }));
    expect(onChangeFile).toHaveBeenCalled();
  });

  it('renders custom action', () => {
    render(<FileInfoHeader fileName="test.pdf" action={<button type="button">Custom</button>} />);
    expect(screen.getByRole('button', { name: /Custom/i })).toBeInTheDocument();
  });
});
