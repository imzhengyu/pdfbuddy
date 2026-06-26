import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureViewShell } from '../../src/components/common/FeatureViewShell';

describe('FeatureViewShell', () => {
  it('renders title and description', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        isEmpty={true}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={<div data-testid="content">Content</div>}
      />
    );

    expect(screen.getByRole('heading', { name: 'Test Feature' })).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders empty view when isEmpty is true', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        isEmpty={true}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={<div data-testid="content">Content</div>}
      />
    );

    expect(screen.getByTestId('empty')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  it('renders workspace when isEmpty is false', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        isEmpty={false}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={<div data-testid="content">Content</div>}
      />
    );

    expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders workspace render function when isEmpty is false', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        isEmpty={false}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={() => <div data-testid="content">Content</div>}
      />
    );

    expect(screen.queryByTestId('empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
