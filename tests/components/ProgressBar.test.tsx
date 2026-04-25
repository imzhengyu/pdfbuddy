import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../src/components/common/ProgressBar/ProgressBar';
import { ProcessingProgress } from '../../src/services/pdf/types';

describe('ProgressBar', () => {
  const progress: ProcessingProgress = { current: 2, total: 5, percent: 40 };

  it('renders with progress value', () => {
    render(<ProgressBar progress={progress} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText(/2.*of.*5/)).toBeInTheDocument();
  });

  it('renders with custom showLabel true', () => {
    render(<ProgressBar progress={progress} showLabel={true} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
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
});