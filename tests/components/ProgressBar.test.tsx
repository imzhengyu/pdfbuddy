import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressBar } from '../../src/components/common/ProgressBar/ProgressBar';
import { ProcessingProgress } from '../../src/services/pdf/types';

describe('ProgressBar', () => {
  const progress: ProcessingProgress = { current: 2, total: 5, percent: 40 };

  describe('linear variant', () => {
    it('renders with progress value', () => {
      render(<ProgressBar progress={progress} />);
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText(/2.*of.*5/)).toBeInTheDocument();
    });

    it('renders with custom showLabel true', () => {
      render(<ProgressBar progress={progress} showLabel={true} />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders with showLabel false', () => {
      render(<ProgressBar progress={progress} showLabel={false} />);
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });

    it('renders with 0% progress', () => {
      const zeroProgress: ProcessingProgress = { current: 0, total: 5, percent: 0 };
      render(<ProgressBar progress={zeroProgress} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('renders with 100% progress', () => {
      const fullProgress: ProcessingProgress = { current: 5, total: 5, percent: 100 };
      render(<ProgressBar progress={fullProgress} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders with single item total', () => {
      const singleProgress: ProcessingProgress = { current: 1, total: 1, percent: 100 };
      render(<ProgressBar progress={singleProgress} />);
      expect(screen.getByText(/1.*of.*1/)).toBeInTheDocument();
    });

    it('renders progress bar track', () => {
      render(<ProgressBar progress={progress} />);
      const track = screen.getByRole('progressbar');
      expect(track).toBeInTheDocument();
      expect(track).toHaveAttribute('aria-valuenow', '40');
    });
  });

  describe('circular variant', () => {
    it('renders circular variant with default size', () => {
      render(<ProgressBar progress={progress} variant="circular" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders circular variant with sm size', () => {
      render(<ProgressBar progress={progress} variant="circular" size="sm" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders circular variant with lg size', () => {
      render(<ProgressBar progress={progress} variant="circular" size="lg" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders circular variant with 100% progress', () => {
      const fullProgress: ProcessingProgress = { current: 5, total: 5, percent: 100 };
      render(<ProgressBar progress={fullProgress} variant="circular" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('renders circular variant without label when showLabel is false', () => {
      render(<ProgressBar progress={progress} variant="circular" showLabel={false} />);
      expect(screen.queryByText(/of/)).not.toBeInTheDocument();
    });

    it('renders circular variant with label when showLabel is true', () => {
      render(<ProgressBar progress={progress} variant="circular" showLabel={true} />);
      expect(screen.getByText(/2.*of.*5/)).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<ProgressBar progress={progress} size="sm" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders md size', () => {
      render(<ProgressBar progress={progress} size="md" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('renders lg size', () => {
      render(<ProgressBar progress={progress} size="lg" />);
      expect(screen.getByText('40%')).toBeInTheDocument();
    });
  });
});