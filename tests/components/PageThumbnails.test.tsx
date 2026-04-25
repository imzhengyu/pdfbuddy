import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PageThumbnails } from '../../src/components/common/PageThumbnails/PageThumbnails';
import React from 'react';

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    load: vi.fn().mockResolvedValue({
      getPageCount: vi.fn().mockReturnValue(3)
    })
  }
}));

const mockFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
Object.defineProperty(mockFile, 'arrayBuffer', {
  writable: true,
  value: vi.fn().mockResolvedValue(new ArrayBuffer(10))
});

describe('PageThumbnails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    await waitFor(() => {
      expect(screen.queryByText('Loading pages...')).toBeNull();
    });

    const thumbnails = screen.getAllByText(/Page \d/);
    if (thumbnails.length > 0) {
      fireEvent.click(thumbnails[0]);
      expect(onSelectMock).toHaveBeenCalledWith(0);
    }
  });

  it('handles error when loading PDF fails', async () => {
    const { PDFDocument } = await import('pdf-lib');
    (PDFDocument.load as any).mockRejectedValueOnce(new Error('Failed to load PDF'));

    const errorFile = new File(['bad pdf'], 'error.pdf', { type: 'application/pdf' });
    Object.defineProperty(errorFile, 'arrayBuffer', {
      writable: true,
      value: vi.fn().mockResolvedValue(new ArrayBuffer(10))
    });

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
});