import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from '../../src/components/common/ErrorDisplay/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('renders nothing when message is empty', () => {
    const { container } = render(<ErrorDisplay message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders alert variant by default', () => {
    render(<ErrorDisplay message="Something went wrong" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders inline variant when specified', () => {
    render(<ErrorDisplay message="Error occurred" variant="inline" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.className).toContain('inline');
  });

  it('shows retry button when onRetry provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={handleRetry} />);
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorDisplay message="Error" onRetry={handleRetry} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss provided', () => {
    render(<ErrorDisplay message="Error" onDismiss={() => {}} />);
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const handleDismiss = vi.fn();
    render(<ErrorDisplay message="Error" onDismiss={handleDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows both retry and dismiss when both provided', () => {
    render(<ErrorDisplay message="Error" onRetry={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<ErrorDisplay message="Error" />);
    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});