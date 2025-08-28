import * as Sentry from '@sentry/react'
import { env } from './env'

let isInitialized = false

export const initSentry = () => {
  if (!env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization')
    return
  }

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_SENTRY_ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, _hint) {
      // Filter out sensitive information
      if (event.request?.cookies) {
        delete event.request.cookies
      }
      
      // Don't send events in test environment
      if (env.VITE_APP_ENV === 'test') {
        return null
      }
      
      return event
    },
  })
  
  isInitialized = true
}

// Safe wrappers that only call Sentry if initialized
export const captureException = (...args: Parameters<typeof Sentry.captureException>) => {
  if (isInitialized) {
    return Sentry.captureException(...args)
  }
  console.error('Sentry not initialized, error not captured:', args[0])
}

export const captureMessage = (...args: Parameters<typeof Sentry.captureMessage>) => {
  if (isInitialized) {
    return Sentry.captureMessage(...args)
  }
  console.log('Sentry not initialized, message not captured:', args[0])
}

export const withProfiler = Sentry.withProfiler
export const ErrorBoundary = Sentry.ErrorBoundary