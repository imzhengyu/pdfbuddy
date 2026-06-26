import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBanner } from '../../src/components/common/ErrorBanner';

describe('ErrorBanner', () => {
  it('does not render when message is null', () => {
    render(<ErrorBanner message={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('calls onDismiss when close button clicked', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: /Dismiss error/i }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
