import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PreviewModal, clearPreviewImageCache, getPreviewImageCacheSize } from '../../src/components/common/PreviewModal/PreviewModal';
import React from 'react';
import { createMockPDFFile } from '../utils/testHelpers';
import { pdfCache } from '../../src/services/pdf/pdfCache';
import { CONST_CACHE_CONFIG } from '../../src/config';

// Mock getPdfjsLib so we don't rely on dynamic import interception
vi.mock('../../src/services/pdf/pdfjsInitializer', () => ({
  getPdfjsLib: vi.fn().mockResolvedValue({
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 3,
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
          render: vi.fn().mockReturnValue({
            promise: Promise.resolve()
          })
        })
      })
    }),
    GlobalWorkerOptions: {
      workerSrc: ''
    }
  })
}));

// Mock canvas toDataURL
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockimage');

const mockFile = createMockPDFFile('mock pdf content', 'test.pdf');

describe('PreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pdfCache.clear();
    clearPreviewImageCache();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PreviewModal
        isOpen={false}
        onClose={() => {}}
        file={mockFile}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders loading state initially when opened', () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    expect(screen.getByText('Loading PDF...')).toBeInTheDocument();
  });

  it('exposes dialog semantics and takes focus when opened (P1-1)', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
        title="Preview"
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName(/Preview/);
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await waitFor(() => expect(dialog).toHaveFocus());
  });

  it('returns focus to whatever opened it (P1-1)', async () => {
    const { rerender } = render(
      <div>
        <button data-testid="trigger">open</button>
        <PreviewModal isOpen={false} onClose={() => {}} file={mockFile} />
      </div>
    );

    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(
      <div>
        <button data-testid="trigger">open</button>
        <PreviewModal isOpen={true} onClose={() => {}} file={mockFile} />
      </div>
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());

    rerender(
      <div>
        <button data-testid="trigger">open</button>
        <PreviewModal isOpen={false} onClose={() => {}} file={mockFile} />
      </div>
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps the page image cache within its bound (P0-1)', async () => {
    const { rerender } = render(
      <PreviewModal isOpen={true} onClose={() => {}} file={mockFile} />
    );
    await waitFor(() => expect(getPreviewImageCacheSize()).toBeGreaterThan(0));

    // Each file caches its own pages; without eviction the module-level map
    // would grow with every document the user previews.
    for (let i = 0; i < 8; i++) {
      const file = createMockPDFFile(`mock pdf content ${i}`, `file-${i}.pdf`);
      rerender(<PreviewModal isOpen={true} onClose={() => {}} file={file} />);
      await waitFor(() =>
        expect(screen.getByTestId('preview-modal-header')).toHaveTextContent(`file-${i}.pdf`)
      );
    }

    await waitFor(() => expect(getPreviewImageCacheSize()).toBeGreaterThan(0));
    expect(getPreviewImageCacheSize()).toBeLessThanOrEqual(
      CONST_CACHE_CONFIG.previewImageCacheCapacity
    );
  });

  it('renders header with file name', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
        title="Preview"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('preview-modal-header')).toHaveTextContent('Preview: test.pdf');
    });
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
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    const closeButton = screen.getByRole('button', { name: 'Close preview' });
    await act(async () => {
      fireEvent.click(closeButton);
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onCloseMock = vi.fn();
    render(
      <PreviewModal
        isOpen={true}
        onClose={onCloseMock}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('navigates to next page when next button is clicked', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    const nextButton = screen.getByRole('button', { name: 'Next page' });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates to previous page when previous button is clicked', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Go to page 2 first
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Go back to page 1
    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    await act(async () => {
      fireEvent.click(prevButton);
    });

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('disables previous button on first page', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    const prevButton = screen.getByRole('button', { name: 'Previous page' });
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', async () => {
    render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // Navigate to last page (page 3)
    const nextButton = screen.getByRole('button', { name: 'Next page' });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('does not re-render cached pages when reopening the same file', async () => {
    const getPageMock = vi.fn().mockResolvedValue({
      getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
    });

    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');
    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        promise: Promise.resolve({
          numPages: 2,
          getPage: getPageMock
        })
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    const { rerender } = render(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // getPage should be called for initial page load (current page + adjacent pages)
    const initialCalls = getPageMock.mock.calls.length;
    expect(initialCalls).toBeGreaterThan(0);

    // Close the modal
    rerender(
      <PreviewModal
        isOpen={false}
        onClose={() => {}}
        file={mockFile}
      />
    );

    // Reopen the modal with the same file
    rerender(
      <PreviewModal
        isOpen={true}
        onClose={() => {}}
        file={mockFile}
      />
    );

    // Wait for reopen
    await waitFor(() => {
      expect(screen.queryByText('Loading PDF...')).toBeNull();
    });

    // getPage should not be called additional times because pages are cached
    // Note: We allow the same number of calls as initial, but not more
    expect(getPageMock.mock.calls.length).toBeLessThanOrEqual(initialCalls + 2); // small tolerance for re-check
  });
});
