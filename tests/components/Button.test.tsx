import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/common/Button/Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button label="Click me" onClick={() => {}} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button label="Click me" onClick={() => {}} loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});