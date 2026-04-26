import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewModal } from './PreviewModal';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(5)
    })
  }
}));

const mockFile = new File(['mock pdf'], 'test.pdf', { type: 'application/pdf' });
Object.defineProperty(mockFile, 'arrayBuffer', {
  writable: true,
  value: vi.fn().mockResolvedValue(new ArrayBuffer(10))
});

describe('PreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        title="Test Preview"
      />
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PreviewModal
        isOpen={false}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });

  it('does not render when file is null', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={null}
      />
    );

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Close preview' });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders navigation buttons', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
  });

  it('renders zoom controls', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('zoom controls work', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByRole('button', { name: 'Zoom out' });
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('closes when clicking overlay', () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    const overlay = document.querySelector('[class*="overlay"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('shows loading state while PDF is being loaded', async () => {
    const { PDFDocument } = await import('pdf-lib');
    (PDFDocument.load as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ getPageCount: () => 5 }), 100)));

    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('shows error message when PDF loading fails', async () => {
    const { PDFDocument } = await import('pdf-lib');
    (PDFDocument.load as any).mockRejectedValue(new Error('Failed to load PDF'));

    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(screen.getByText('Error loading PDF')).toBeInTheDocument();
    expect(screen.getByText('Failed to load PDF')).toBeInTheDocument();
  });
});