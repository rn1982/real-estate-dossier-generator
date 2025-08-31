import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/react'
import { captureException, captureMessage, withProfiler, ErrorBoundary } from './sentry'

// Mock the env module
vi.mock('./env', () => ({
  env: {
    VITE_SENTRY_DSN: 'https://test@sentry.io/123',
    VITE_SENTRY_ENVIRONMENT: 'test',
    VITE_APP_ENV: 'development',
  },
}))

describe('sentry configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initSentry', () => {
    it('should initialize Sentry when DSN is provided', async () => {
      // Import fresh to trigger initialization
      const { initSentry: init } = await import('./sentry')
      init()

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://test@sentry.io/123',
          environment: 'test',
          tracesSampleRate: 1.0,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          beforeSend: expect.any(Function),
        })
      )
    })

    it('should skip initialization when DSN is not provided', async () => {
      // Mock env without DSN
      vi.doMock('./env', () => ({
        env: {
          VITE_SENTRY_DSN: undefined,
          VITE_SENTRY_ENVIRONMENT: 'test',
          VITE_APP_ENV: 'development',
        },
      }))

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Re-import to get fresh module with new env
      vi.resetModules()
      const { initSentry: init } = await import('./sentry')
      init()

      expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not configured, skipping initialization')
      expect(Sentry.init).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should use production sample rate in production environment', async () => {
      // Mock production environment
      vi.doMock('./env', () => ({
        env: {
          VITE_SENTRY_DSN: 'https://test@sentry.io/123',
          VITE_SENTRY_ENVIRONMENT: 'production',
          VITE_APP_ENV: 'production',
        },
      }))

      vi.resetModules()
      const { initSentry: init } = await import('./sentry')
      init()

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
        })
      )
    })

    it('should filter sensitive data in beforeSend', async () => {
      const { initSentry: init } = await import('./sentry')
      init()

      // Get the beforeSend function from the call
      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0]
      const beforeSend = initCall.beforeSend

      // Test filtering of cookies
      const event = {
        request: {
          cookies: 'session=secret;token=abc123',
          url: 'https://example.com',
        },
      }

      const filteredEvent = beforeSend(event, {})
      expect(filteredEvent.request.cookies).toBeUndefined()
      expect(filteredEvent.request.url).toBe('https://example.com')
    })

    it('should return null in test environment', async () => {
      // Mock test environment
      vi.doMock('./env', () => ({
        env: {
          VITE_SENTRY_DSN: 'https://test@sentry.io/123',
          VITE_SENTRY_ENVIRONMENT: 'test',
          VITE_APP_ENV: 'test',
        },
      }))

      vi.resetModules()
      const { initSentry: init } = await import('./sentry')
      init()

      const initCall = (Sentry.init as jest.Mock).mock.calls[0][0]
      const beforeSend = initCall.beforeSend

      const event = { message: 'test error' }
      const result = beforeSend(event, {})

      expect(result).toBeNull()
    })
  })

  describe('exported functions', () => {
    it('should export captureException from Sentry', () => {
      expect(captureException).toBe(Sentry.captureException)
    })

    it('should export captureMessage from Sentry', () => {
      expect(captureMessage).toBe(Sentry.captureMessage)
    })

    it('should export withProfiler from Sentry', () => {
      expect(withProfiler).toBe(Sentry.withProfiler)
    })

    it('should export ErrorBoundary from Sentry', () => {
      expect(ErrorBoundary).toBe(Sentry.ErrorBoundary)
    })
  })

  describe('integration configuration', () => {
    it('should configure browserTracingIntegration', async () => {
      const { initSentry: init } = await import('./sentry')
      init()

      expect(Sentry.browserTracingIntegration).toHaveBeenCalled()
    })

    it('should configure replayIntegration with privacy settings', async () => {
      const { initSentry: init } = await import('./sentry')
      init()

      expect(Sentry.replayIntegration).toHaveBeenCalledWith({
        maskAllText: true,
        blockAllMedia: true,
      })
    })
  })
})