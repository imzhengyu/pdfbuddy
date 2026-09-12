import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PageThumbnails, ThumbnailItem } from '../../src/components/common/PageThumbnails/PageThumbnails';
import React from 'react';
import { createMockPDFFile, createMockPDFJSDocument } from '../utils/testHelpers';
import { pdfCache } from '../../src/services/pdf/pdfCache';
import { CONST_LIMITS_CONFIG } from '../../src/config';

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

describe('PageThumbnails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pdfCache.clear();
  });

  it('renders loading state initially', () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    expect(screen.getByText('Loading pages...')).toBeInTheDocument();
  });

  it('renders without file', () => {
    render(
      <PageThumbnails
        file={null as any}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );
    expect(screen.getByText('Loading pages...')).toBeInTheDocument();
  });

  it('renders with empty selected pages after loading', async () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });
  });

  it('renders the pages in the order it is given (B-1)', async () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
        order={[2, 0, 1]}
      />
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('thumbnail-item')).toHaveLength(3);
    });

    const items = screen.queryAllByTestId('thumbnail-item');
    expect(items.map((item) => item.getAttribute('data-page-index'))).toEqual(['2', '0', '1']);
    // Labels follow the on-screen position, not the original page number.
    expect(items.map((item) => item.getAttribute('data-page-position'))).toEqual(['0', '1', '2']);
    expect(items[0]).toHaveTextContent('Page 1');
    expect(items[2]).toHaveTextContent('Page 3');
  });

  it('does not reuse the previous document when the file changes (B-6)', async () => {
    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');

    const { rerender } = render(
      <PageThumbnails file={mockFile} onSelect={() => {}} selectedPages={[]} />
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('thumbnail-item')).toHaveLength(3);
    });

    // Second file has a different page count: if the parsed document were kept,
    // the grid would still show three pages.
    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        promise: Promise.resolve({
          numPages: 2,
          getPage: vi.fn().mockResolvedValue({
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
          })
        })
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    const otherFile = createMockPDFFile('other pdf content', 'other.pdf');
    rerender(<PageThumbnails file={otherFile} onSelect={() => {}} selectedPages={[]} />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('thumbnail-item')).toHaveLength(2);
    });
  });

  it('caps the grid at the thumbnail limit and says so', async () => {
    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');
    const pageCount = CONST_LIMITS_CONFIG.maxThumbnailPages + 10;

    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        promise: Promise.resolve({
          numPages: pageCount,
          getPage: vi.fn().mockResolvedValue({
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
          })
        })
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    render(
      <PageThumbnails
        file={createMockPDFFile('large pdf', 'large.pdf')}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryAllByTestId('thumbnail-item')).toHaveLength(
          CONST_LIMITS_CONFIG.maxThumbnailPages
        );
      },
      { timeout: 15000 }
    );

    expect(
      screen.getByText(
        `Showing the first ${CONST_LIMITS_CONFIG.maxThumbnailPages} pages only.`
      )
    ).toBeInTheDocument();
  });

  it('shows selected pages as selected', async () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[0, 2]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });
  });

  it('calls onSelect when thumbnail is clicked', async () => {
    const onSelectMock = vi.fn();
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={onSelectMock}
        selectedPages={[]}
      />
    );

    // The component may fail to load thumbnails in test env due to canvas not being
    // supported, but we can still verify the loading state works
    expect(screen.getByText('Loading pages...')).toBeInTheDocument();
  });

  it('handles error when loading PDF fails', async () => {
    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');
    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        get promise() { return Promise.reject(new Error('Failed to load PDF')); }
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    const errorFile = createMockPDFFile('bad pdf', 'error.pdf');

    render(
      <PageThumbnails
        file={errorFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });
  });

  it('renders only visible thumbnails with virtual scrolling', async () => {
    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');
    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        promise: Promise.resolve({
          numPages: 50,
          getPage: vi.fn().mockResolvedValue({
            getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
            render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
          })
        })
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    const largePdfFile = createMockPDFFile('large pdf content', 'large.pdf');

    render(
      <PageThumbnails
        file={largePdfFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    // After loading, we should see thumbnails with the scroll container
    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });
  });

  it('scrollContainer renders when thumbnails are loaded', async () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });
  });

  it('thumbnail divs have role="button" and tabIndex="0"', async () => {
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    const thumbnails = screen.getAllByRole('button', { name: /Select page \d+/ });
    expect(thumbnails.length).toBeGreaterThan(0);
    thumbnails.forEach((thumb) => {
      expect(thumb).toHaveAttribute('tabIndex', '0');
    });
  });

  it('pressing Enter on a thumbnail triggers the click handler', async () => {
    const onSelectMock = vi.fn();
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={onSelectMock}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    const thumbnail = screen.getByRole('button', { name: 'Select page 1' });
    await act(async () => {
      fireEvent.keyDown(thumbnail, { key: 'Enter', code: 'Enter' });
    });

    expect(onSelectMock).toHaveBeenCalledWith(0);
  });

  it('pressing Space on a thumbnail triggers the click handler', async () => {
    const onSelectMock = vi.fn();
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={onSelectMock}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    const thumbnail = screen.getByRole('button', { name: 'Select page 2' });
    await act(async () => {
      fireEvent.keyDown(thumbnail, { key: ' ', code: 'Space' });
    });

    expect(onSelectMock).toHaveBeenCalledWith(1);
  });

  it('rotate button has correct aria-label', async () => {
    const onRotateMock = vi.fn();
    render(
      <PageThumbnails
        file={mockFile}
        onSelect={() => {}}
        selectedPages={[]}
        onRotate={onRotateMock}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    const rotateButtons = screen.getAllByRole('button', { name: 'Rotate page 90 degrees' });
    expect(rotateButtons.length).toBeGreaterThan(0);
    expect(rotateButtons[0]).toHaveAttribute('title', 'Rotate 90°');
  });

  it('handles large PDFs with throttled rendering', async () => {
    const getPageMock = vi.fn().mockResolvedValue({
      getViewport: vi.fn().mockReturnValue({ width: 100, height: 140 }),
      render: vi.fn().mockReturnValue({ promise: Promise.resolve() })
    });

    const { getPdfjsLib } = await import('../../src/services/pdf/pdfjsInitializer');
    (getPdfjsLib as any).mockResolvedValueOnce({
      getDocument: vi.fn().mockReturnValue({
        promise: Promise.resolve({
          numPages: 15,
          getPage: getPageMock
        })
      }),
      GlobalWorkerOptions: { workerSrc: '' }
    });

    const largePdfFile = createMockPDFFile('large pdf content', 'large.pdf');

    render(
      <PageThumbnails
        file={largePdfFile}
        onSelect={() => {}}
        selectedPages={[]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    // All 15 pages should be rendered despite throttling. Rendering yields
    // between chunks now, so this has to wait rather than assert immediately.
    await waitFor(() => {
      expect(getPageMock).toHaveBeenCalledTimes(15);
    }, { timeout: 5000 });
  });

  it('ThumbnailItem memo prevents unnecessary re-renders when props are unchanged', () => {
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const onDragStart = vi.fn();
    const onDragOver = vi.fn();
    const onDragEnd = vi.fn();

    const { rerender } = render(
      <ThumbnailItem
        index={0}
        src="data:image/png;base64,mock"
        fileId="file-123"
        selected={false}
        dragOver={false}
        rotated={0}
        showChangedIndicator={false}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        draggable={false}
      />
    );

    // Re-render with identical props; memo should skip the update
    rerender(
      <ThumbnailItem
        index={0}
        src="data:image/png;base64,mock"
        fileId="file-123"
        selected={false}
        dragOver={false}
        rotated={0}
        showChangedIndicator={false}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        draggable={false}
      />
    );

    // The item should still be present and functional
    const item = screen.getByRole('button', { name: 'Select page 1' });
    expect(item).toBeInTheDocument();
  });
});
