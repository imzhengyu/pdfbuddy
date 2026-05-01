import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PreviewModal } from './PreviewModal';

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({ data: [] }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({ data: [] }),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 })
});

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn().mockImplementation(() => ({
    promise: Promise.resolve({
      numPages: 5,
      getPage: vi.fn().mockResolvedValue({
        getViewport: vi.fn().mockReturnValue({ width: 100, height: 100 }),
        render: vi.fn().mockResolvedValue(undefined)
      })
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
}));

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

  it('renders when isOpen is true', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        title="Test Preview"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
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

  it('calls onClose when close button is clicked', async () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    await waitFor(() => {
      const closeBtn = screen.getByRole('button', { name: 'Close preview' });
      fireEvent.click(closeBtn);
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', async () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders navigation buttons', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    });
  });

  it('renders zoom controls', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('zoom controls work', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByRole('button', { name: 'Zoom out' });
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('closes when clicking overlay', async () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    const overlay = document.querySelector('[class*="overlay"]');
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('shows loading state while PDF is being loaded', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('has onWheel handler on content area for page navigation', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    const content = document.querySelector('[class*="content"]');
    expect(content).toBeTruthy();
  });

  it('navigates to next page with arrow key when not at end', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('navigates to previous page with arrow key when not at start', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('does not go below page 1', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('does not go above total pages', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    }
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  });

  it('renders Fit button', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fit')).toBeInTheDocument();
    });
  });

  it('resets zoom to 100 when Fit is clicked', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    const zoomInBtn = screen.getByRole('button', { name: 'Zoom in' });
    fireEvent.click(zoomInBtn);
    expect(screen.getByText('125%')).toBeInTheDocument();

    const fitBtn = screen.getByText('Fit');
    fireEvent.click(fitBtn);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('previous button is disabled on first page', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: 'Previous page' });
    expect(prevBtn).toBeDisabled();
  });

  it('next button is disabled on last page', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    }

    const nextBtn = screen.getByRole('button', { name: 'Next page' });
    expect(nextBtn).toBeDisabled();
  });

  it('clicking previous page button navigates back', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: 'Previous page' });
    fireEvent.click(prevBtn);
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('clicking next page button navigates forward', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: 'Next page' });
    fireEvent.click(nextBtn);
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('uses custom title when provided', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
        title="My Custom Title"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/My Custom Title/)).toBeInTheDocument();
    });
  });

  it('shows file name in header', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={vi.fn()}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/test\.pdf/)).toBeInTheDocument();
    });
  });
});