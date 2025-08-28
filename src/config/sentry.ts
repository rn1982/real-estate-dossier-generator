import * as Sentry from '@sentry/react'
import { env } from './env'

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
}

export const captureException = Sentry.captureException
export const captureMessage = Sentry.captureMessage
export const withProfiler = Sentry.withProfiler
export const ErrorBoundary = Sentry.ErrorBoundary