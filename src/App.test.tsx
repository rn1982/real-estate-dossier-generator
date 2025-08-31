import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock components that might cause issues in tests
vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => null
}))

vi.mock('@/components/TestErrorButton', () => ({
  TestErrorButton: () => null
}))

// Mock Sentry ErrorBoundary to just render children in tests
vi.mock('@sentry/react', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withProfiler: vi.fn((component: React.ComponentType) => component),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  configureScope: vi.fn()
}))

describe('App', () => {
  it('renders the DossierForm component', () => {
    render(<App />)
    // Use a more flexible matcher in case the text is in different elements
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Générateur de Dossier Immobilier')
  })

  it('renders the main form sections', () => {
    render(<App />)
    // Look for fieldsets or sections with these labels
    expect(screen.getByText("Informations de l'Agent")).toBeInTheDocument()
    expect(screen.getByText('Informations sur la Propriété')).toBeInTheDocument()
    expect(screen.getByText('Caractéristiques Détaillées')).toBeInTheDocument()
    expect(screen.getByText('Photos de la Propriété')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<App />)
    // Look for the submit button with more flexible text matching
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(button => 
      button.textContent?.toLowerCase().includes('soumettre') ||
      button.textContent?.toLowerCase().includes('submit') ||
      button.textContent?.toLowerCase().includes('envoyer')
    )
    expect(submitButton).toBeInTheDocument()
  })
})