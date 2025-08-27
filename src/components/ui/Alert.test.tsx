import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert Component', () => {
  it('should render alert with title and description', () => {
    render(
      <Alert 
        title="Test Alert Title" 
        description="Test alert description"
      />
    );
    
    expect(screen.getByText('Test Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Test alert description')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    const { container } = render(
      <Alert title="Default Alert" />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('bg-background');
    expect(alertElement).toHaveClass('text-foreground');
  });

  it('should apply success variant styles', () => {
    const { container } = render(
      <Alert title="Success Alert" variant="success" />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('border-green-200');
    expect(alertElement).toHaveClass('bg-green-50');
    expect(alertElement).toHaveClass('text-green-900');
  });

  it('should apply error variant styles', () => {
    const { container } = render(
      <Alert title="Error Alert" variant="error" />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('border-red-200');
    expect(alertElement).toHaveClass('bg-red-50');
    expect(alertElement).toHaveClass('text-red-900');
  });

  it('should apply warning variant styles', () => {
    const { container } = render(
      <Alert title="Warning Alert" variant="warning" />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('border-yellow-200');
    expect(alertElement).toHaveClass('bg-yellow-50');
    expect(alertElement).toHaveClass('text-yellow-900');
  });

  it('should apply info variant styles', () => {
    const { container } = render(
      <Alert title="Info Alert" variant="info" />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('border-blue-200');
    expect(alertElement).toHaveClass('bg-blue-50');
    expect(alertElement).toHaveClass('text-blue-900');
  });

  it('should render children content', () => {
    render(
      <Alert>
        <p>Custom child content</p>
      </Alert>
    );
    
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });

  it('should render action when provided', async () => {
    const handleAction = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Alert 
        title="Alert with Action"
        action={
          <button onClick={handleAction}>Take Action</button>
        }
      />
    );
    
    const actionButton = screen.getByText('Take Action');
    expect(actionButton).toBeInTheDocument();
    
    await user.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('should display appropriate icon for each variant', () => {
    const { container: defaultContainer } = render(
      <Alert title="Default" variant="default" />
    );
    
    const { container: successContainer } = render(
      <Alert title="Success" variant="success" />
    );
    
    const { container: errorContainer } = render(
      <Alert title="Error" variant="error" />
    );
    
    const { container: warningContainer } = render(
      <Alert title="Warning" variant="warning" />
    );
    
    const { container: infoContainer } = render(
      <Alert title="Info" variant="info" />
    );
    
    // Check that each variant has an icon (svg element)
    expect(defaultContainer.querySelector('svg')).toBeInTheDocument();
    expect(successContainer.querySelector('svg')).toBeInTheDocument();
    expect(errorContainer.querySelector('svg')).toBeInTheDocument();
    expect(warningContainer.querySelector('svg')).toBeInTheDocument();
    expect(infoContainer.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Alert 
        title="Custom Class Alert" 
        className="custom-alert-class"
      />
    );
    
    const alertElement = container.querySelector('[role="alert"]');
    expect(alertElement).toHaveClass('custom-alert-class');
  });

  it('should have proper role attribute for accessibility', () => {
    render(
      <Alert title="Accessible Alert" />
    );
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(
      <Alert description="Only description, no title" />
    );
    
    expect(screen.getByText('Only description, no title')).toBeInTheDocument();
  });

  it('should render without description', () => {
    render(
      <Alert title="Only title, no description" />
    );
    
    expect(screen.getByText('Only title, no description')).toBeInTheDocument();
  });

  it('should render with both title and children', () => {
    render(
      <Alert title="Alert Title">
        <div>Additional content as children</div>
      </Alert>
    );
    
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Additional content as children')).toBeInTheDocument();
  });
});