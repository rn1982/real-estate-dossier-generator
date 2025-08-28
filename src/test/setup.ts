import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock Sentry before any imports that might use it
vi.mock('@sentry/react')

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
