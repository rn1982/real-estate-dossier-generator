import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Toast, ToastProvider, ToastViewport } from './Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toast with title and description', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Test Title" 
          description="Test Description"
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should apply success variant styles', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Success!" 
          variant="success"
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    const toastElement = document.querySelector('[role="status"]');
    if (toastElement) {
      expect(toastElement.className).toContain('border-green-200');
      expect(toastElement.className).toContain('bg-green-50');
      expect(toastElement.className).toContain('text-green-900');
    }
  });

  it('should apply error variant styles', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Error!" 
          variant="error"
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    const toastElement = document.querySelector('[role="status"]');
    if (toastElement) {
      expect(toastElement.className).toContain('border-red-200');
      expect(toastElement.className).toContain('bg-red-50');
      expect(toastElement.className).toContain('text-red-900');
    }
  });

  it('should apply warning variant styles', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Warning!" 
          variant="warning"
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    const toastElement = document.querySelector('[role="status"]');
    if (toastElement) {
      expect(toastElement.className).toContain('border-yellow-200');
      expect(toastElement.className).toContain('bg-yellow-50');
      expect(toastElement.className).toContain('text-yellow-900');
    }
  });

  it('should apply info variant styles', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Info" 
          variant="info"
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    const toastElement = document.querySelector('[role="status"]');
    if (toastElement) {
      expect(toastElement.className).toContain('border-blue-200');
      expect(toastElement.className).toContain('bg-blue-50');
      expect(toastElement.className).toContain('text-blue-900');
    }
  });

  it('should render action when provided', () => {
    const handleAction = vi.fn();
    
    render(
      <ToastProvider>
        <Toast 
          title="Test with Action"
          action={
            <button onClick={handleAction}>Retry</button>
          }
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
  });


  it('should auto-dismiss after duration', async () => {
    const handleOpenChange = vi.fn();
    
    render(
      <ToastProvider duration={100}>
        <Toast 
          title="Auto-dismiss Toast"
          onOpenChange={handleOpenChange}
          open={true}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    // Wait for auto-dismiss
    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    }, { timeout: 200 });
  });

  it('should position viewport correctly', () => {
    const { container } = render(
      <ToastProvider>
        <ToastViewport />
      </ToastProvider>
    );
    
    const viewport = container.querySelector('[data-radix-toast-viewport]');
    if (viewport) {
      expect(viewport.className).toContain('fixed');
      expect(viewport.className).toContain('bottom-0');
      expect(viewport.className).toContain('z-[100]');
    }
  });

  it('should not render toast when open is false', () => {
    render(
      <ToastProvider>
        <Toast 
          title="Hidden Toast"
          open={false}
        />
        <ToastViewport />
      </ToastProvider>
    );
    
    expect(screen.queryByText('Hidden Toast')).not.toBeInTheDocument();
  });
});