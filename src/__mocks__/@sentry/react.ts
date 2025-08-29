// Mock for @sentry/react
import { vi } from 'vitest'
import { ComponentType, ReactNode } from 'react'

export const init = vi.fn()
export const captureException = vi.fn()
export const captureMessage = vi.fn()
export const withProfiler = vi.fn((component: ComponentType) => component)
export const browserTracingIntegration = vi.fn(() => ({ name: 'BrowserTracing' }))
export const replayIntegration = vi.fn(() => ({ name: 'Replay' }))
export const configureScope = vi.fn((callback: (scope: any) => void) => {
  callback({
    setContext: vi.fn(),
    setTag: vi.fn(),
    setExtra: vi.fn(),
    setUser: vi.fn(),
  })
})

export const ErrorBoundary = vi.fn(({ children }: { children: ReactNode }) => {
  // Simple mock that just renders children normally
  // In tests, we can mock this to test error scenarios
  return children
})

// Mock Sentry object
const Sentry = {
  init,
  captureException,
  captureMessage,
  withProfiler,
  browserTracingIntegration,
  replayIntegration,
  configureScope,
  ErrorBoundary,
}

export default Sentry