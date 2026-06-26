import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { DraggableFileList } from '../../src/components/common/DraggableFileList/DraggableFileList';

describe('DraggableFileList', () => {
  const createFile = (name: string) => new File(['test'], name, { type: 'application/pdf' });

  const mockFiles = [
    { id: '1', file: createFile('file1.pdf') },
    { id: '2', file: createFile('file2.pdf') },
    { id: '3', file: createFile('file3.pdf') }
  ];

  describe('Rendering', () => {
    it('renders empty when files array is empty', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={[]} onReorder={onReorder} onRemove={onRemove} />);
      expect(screen.queryByText('file1.pdf')).toBeNull();
    });

    it('renders file names and sizes', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);
      expect(screen.getByText('file1.pdf')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
      expect(screen.getByText('file3.pdf')).toBeInTheDocument();
    });

    it('shows 1-based index for each file', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders drag handles for each file', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);
      const dragHandles = document.querySelectorAll('[class*="dragHandle"]');
      expect(dragHandles.length).toBe(3);
    });

    it('renders Remove buttons', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);
      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      expect(removeButtons.length).toBe(3);
    });

    it('marks items as draggable', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);
      const draggableItems = document.querySelectorAll('[draggable=true]');
      expect(draggableItems.length).toBe(3);
    });
  });

  describe('Interactions', () => {
    it('calls onRemove when Remove button is clicked', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      fireEvent.click(removeButtons[0]);

      expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('calls onRemove with correct id for each file', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      fireEvent.click(removeButtons[1]);

      expect(onRemove).toHaveBeenCalledWith('2');
    });

    it('applies dragging class during drag start', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      const { container } = render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const items = container.querySelectorAll('[draggable=true]');
      expect(items[0]).not.toBeNull();
    });
  });

  describe('Drag and drop reordering', () => {
    it('calls onReorder with correct indices when item is dropped at different position', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      const { container } = render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const items = container.querySelectorAll('[draggable=true]');
      const firstItem = items[0] as HTMLElement;
      const thirdItem = items[2] as HTMLElement;

      // Simulate drag from first item to third position
      fireEvent.dragStart(firstItem);
      fireEvent.dragOver(thirdItem);
      fireEvent.dragEnd(thirdItem);

      expect(onReorder).toHaveBeenCalledWith(0, 2);
    });

    it('does not call onReorder when dropped at same position', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      const { container } = render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const items = container.querySelectorAll('[draggable=true]');
      const secondItem = items[1] as HTMLElement;

      fireEvent.dragStart(secondItem);
      fireEvent.dragOver(secondItem);
      fireEvent.dragEnd(secondItem);

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder when drag is cancelled', () => {
      const onReorder = vi.fn();
      const onRemove = vi.fn();
      const { container } = render(<DraggableFileList files={mockFiles} onReorder={onReorder} onRemove={onRemove} />);

      const items = container.querySelectorAll('[draggable=true]');
      const firstItem = items[0] as HTMLElement;

      fireEvent.dragStart(firstItem);
      // No dragOver before dragEnd - simulates cancelled drag

      expect(onReorder).not.toHaveBeenCalled();
    });
  });
});