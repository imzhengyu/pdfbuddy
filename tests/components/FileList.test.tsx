import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileList } from '../../src/components/common/FileList/FileList';

describe('FileList', () => {
  const mockFiles = [
    { id: '1', file: new File(['test1'], 'file1.pdf', { type: 'application/pdf' }), pageCount: 5 },
    { id: '2', file: new File(['test2'], 'file2.pdf', { type: 'application/pdf' }), pageCount: 10 }
  ];

  it('renders empty when files array is empty', () => {
    render(<FileList files={[]} onRemove={() => {}} />);
    const list = screen.queryByText('file1.pdf');
    expect(list).toBeNull();
  });

  it('renders file name and size', () => {
    render(<FileList files={mockFiles} onRemove={() => {}} />);
    expect(screen.getByText('file1.pdf')).toBeInTheDocument();
    expect(screen.getByText('file2.pdf')).toBeInTheDocument();
  });

  it('shows 1-based index for each file', () => {
    render(<FileList files={mockFiles} onRemove={() => {}} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows page count when showPageCount is true', () => {
    render(<FileList files={mockFiles} onRemove={() => {}} showPageCount={true} />);
    expect(screen.getByText('5 pages')).toBeInTheDocument();
    expect(screen.getByText('10 pages')).toBeInTheDocument();
  });

  it('hides page count when showPageCount is false', () => {
    render(<FileList files={mockFiles} onRemove={() => {}} showPageCount={false} />);
    expect(screen.queryByText('5 pages')).toBeNull();
    expect(screen.queryByText('10 pages')).toBeNull();
  });

  it('calls onRemove when Remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<FileList files={mockFiles} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('renders multiple Remove buttons', () => {
    const onRemove = vi.fn();
    render(<FileList files={mockFiles} onRemove={onRemove} />);
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons.length).toBe(2);
  });
});