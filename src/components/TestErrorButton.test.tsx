import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestErrorButton } from './TestErrorButton'
import { captureException, captureMessage } from '@/config/sentry'

// Mock Sentry functions
vi.mock('@/config/sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

// Mock fetch for API testing
global.fetch = vi.fn()

describe('TestErrorButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock alert
    global.alert = vi.fn()
    // Mock setTimeout
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Environment visibility', () => {
    it('should render in development environment', () => {
      // Mock development environment
      vi.stubEnv('VITE_APP_ENV', 'development')
      
      render(<TestErrorButton />)
      
      expect(screen.getByText('Sentry Test (Dev Only)')).toBeInTheDocument()
    })

    it('should not render in production environment', () => {
      // Mock production environment
      vi.stubEnv('VITE_APP_ENV', 'production')
      
      const { container } = render(<TestErrorButton />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should not render in test environment', () => {
      // Mock test environment
      vi.stubEnv('VITE_APP_ENV', 'test')
      
      const { container } = render(<TestErrorButton />)
      
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Error type selection', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_APP_ENV', 'development')
    })

    it('should display all error type options', () => {
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox')
      const options = select.querySelectorAll('option')
      
      expect(options).toHaveLength(4)
      expect(options[0]).toHaveTextContent('Handled Error')
      expect(options[1]).toHaveTextContent('Unhandled Error')
      expect(options[2]).toHaveTextContent('Test Message')
      expect(options[3]).toHaveTextContent('API Error')
    })

    it('should update selected error type', () => {
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox') as HTMLSelectElement
      
      fireEvent.change(select, { target: { value: 'message' } })
      
      expect(select.value).toBe('message')
    })
  })

  describe('Error triggering', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_APP_ENV', 'development')
      vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should trigger handled error and capture exception', () => {
      render(<TestErrorButton />)
      
      const button = screen.getByText('Trigger Test')
      fireEvent.click(button)
      
      expect(captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error from frontend - This is a test error for Sentry',
        })
      )
      expect(global.alert).toHaveBeenCalledWith('Test error sent to Sentry!')
    })

    it('should trigger unhandled error with setTimeout', () => {
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'unhandled' } })
      
      const button = screen.getByText('Trigger Test')
      
      // Expect the click to throw after timeout
      expect(() => {
        fireEvent.click(button)
        vi.runAllTimers()
      }).toThrow('Unhandled test error - This should be caught by error boundary')
    })

    it('should capture message when message type is selected', () => {
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'message' } })
      
      const button = screen.getByText('Trigger Test')
      fireEvent.click(button)
      
      expect(captureMessage).toHaveBeenCalledWith(
        'Test message from frontend',
        'warning'
      )
      expect(global.alert).toHaveBeenCalledWith('Test message sent to Sentry!')
    })

    it('should trigger API error and handle response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'api' } })
      
      const button = screen.getByText('Trigger Test')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/test-error')
        expect(global.alert).toHaveBeenCalledWith('API test error triggered!')
      }, { timeout: 1000 })
    })

    it('should capture API error on fetch failure', async () => {
      const fetchError = new Error('Network error')
      ;(global.fetch as any).mockRejectedValueOnce(fetchError)
      
      render(<TestErrorButton />)
      
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'api' } })
      
      const button = screen.getByText('Trigger Test')
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(captureException).toHaveBeenCalledWith(fetchError)
        expect(console.error).toHaveBeenCalledWith('API test error:', fetchError)
      }, { timeout: 1000 })
    })
  })

  describe('Component styling', () => {
    beforeEach(() => {
      vi.stubEnv('VITE_APP_ENV', 'development')
    })

    it('should render with correct styling classes', () => {
      const { container } = render(<TestErrorButton />)
      
      // Check container styling
      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass(
        'fixed',
        'bottom-4',
        'right-4',
        'bg-white',
        'border',
        'border-red-500',
        'rounded-lg',
        'p-4',
        'shadow-lg',
        'z-50'
      )
      
      // Check title styling
      const title = screen.getByText('Sentry Test (Dev Only)')
      expect(title).toHaveClass('text-sm', 'font-bold', 'text-red-600', 'mb-2')
      
      // Check button styling
      const button = screen.getByText('Trigger Test')
      expect(button).toHaveClass(
        'w-full',
        'px-3',
        'py-1',
        'bg-red-600',
        'text-white',
        'text-sm',
        'rounded',
        'hover:bg-red-700',
        'transition-colors'
      )
    })
  })
})