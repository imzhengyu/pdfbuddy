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

  it('shows usage steps on the left and limits at the top right', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        usage={['Drop a file', 'Click the button']}
        limits={['Up to 50 pages', 'JPEG and PNG only']}
        isEmpty={true}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={<div data-testid="content">Content</div>}
      />
    );

    const usage = screen.getByRole('complementary', { name: 'How to use Test Feature' });
    expect(usage).toHaveTextContent('Drop a file');
    expect(usage).toHaveTextContent('Click the button');

    const limits = screen.getByRole('complementary', { name: 'Test Feature limits' });
    expect(limits).toHaveTextContent('Up to 50 pages');
    expect(limits).toHaveTextContent('JPEG and PNG only');
  });

  it('renders no panels when usage and limits are omitted', () => {
    render(
      <FeatureViewShell
        title="Test Feature"
        description="Test description"
        isEmpty={true}
        emptyView={<div data-testid="empty">Empty</div>}
        workspace={<div data-testid="content">Content</div>}
      />
    );

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
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
