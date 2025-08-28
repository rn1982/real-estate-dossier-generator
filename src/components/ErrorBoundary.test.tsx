import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import * as SentryReact from '@sentry/react'

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error from component')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Reset the ErrorBoundary mock to render children by default
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ children }: any) => children)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render error fallback when an error occurs', () => {
    // Mock the Sentry ErrorBoundary to trigger fallback
    const mockFallback = vi.fn()
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback, children }: any) => {
      // Simulate error by calling fallback
      if (mockFallback.mock.calls.length === 0) {
        mockFallback()
        const error = new Error('Test error')
        const resetError = vi.fn()
        return fallback({ error, resetError })
      }
      return children
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
    expect(screen.getByText(/Nous sommes désolés/)).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    // Mock the Sentry ErrorBoundary to trigger fallback with specific error
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback }: any) => {
      const error = new Error('Detailed test error message')
      const resetError = vi.fn()
      return fallback({ error, resetError })
    })

    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Détails de l\'erreur (développement uniquement)')).toBeInTheDocument()
    expect(screen.getByText('Detailed test error message')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    // Mock the Sentry ErrorBoundary to trigger fallback
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback }: any) => {
      const error = new Error('Production error')
      const resetError = vi.fn()
      return fallback({ error, resetError })
    })

    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
    expect(screen.queryByText('Détails de l\'erreur')).not.toBeInTheDocument()
    expect(screen.queryByText('Production error')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should call resetError when retry button is clicked', () => {
    const mockResetError = vi.fn()

    // Mock the Sentry ErrorBoundary to trigger fallback
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback }: any) => {
      const error = new Error('Test error')
      return fallback({ error, resetError: mockResetError })
    })

    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    const retryButton = screen.getByText('Réessayer')
    fireEvent.click(retryButton)

    expect(mockResetError).toHaveBeenCalledTimes(1)
  })

  it('should pass showDialog prop to Sentry ErrorBoundary', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(SentryReact.ErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({
        showDialog: true,
      }),
      {}
    )
  })

  it('should render with correct styling classes', () => {
    // Mock the Sentry ErrorBoundary to trigger fallback
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback }: any) => {
      const error = new Error('Style test error')
      const resetError = vi.fn()
      return fallback({ error, resetError })
    })

    const { container } = render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    )

    // Check for main container styling
    const mainContainer = container.querySelector('.min-h-screen.flex.items-center.justify-center')
    expect(mainContainer).toBeInTheDocument()

    // Check for card styling
    const card = container.querySelector('.max-w-md.w-full.bg-white.shadow-lg.rounded-lg')
    expect(card).toBeInTheDocument()

    // Check for button styling
    const button = screen.getByRole('button', { name: /Réessayer/i })
    expect(button).toHaveClass('w-full', 'bg-blue-600', 'text-white')
  })

  it('should handle errors from async components', async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        throw new Error('Async error')
      }, [])
      return <div>Async content</div>
    }

    // Mock the Sentry ErrorBoundary behavior for async errors
    let errorCaught = false
    ;(SentryReact.ErrorBoundary as any).mockImplementation(({ fallback, children }: any) => {
      // Simulate catching async error
      if (!errorCaught) {
        errorCaught = true
        setTimeout(() => {
          const error = new Error('Async error')
          const resetError = vi.fn()
          fallback({ error, resetError })
        }, 0)
      }
      return children
    })

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    )

    // Initially shows the child component
    expect(screen.getByText('Async content')).toBeInTheDocument()
  })
})