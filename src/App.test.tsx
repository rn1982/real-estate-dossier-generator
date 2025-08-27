import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the DossierForm component', () => {
    render(<App />)
    expect(screen.getByText('Formulaire de Soumission de Propriété')).toBeInTheDocument()
  })

  it('renders the main form sections', () => {
    render(<App />)
    expect(screen.getByText("1. Informations de l'Agent")).toBeInTheDocument()
    expect(screen.getByText('2. Informations sur la Propriété')).toBeInTheDocument()
    expect(screen.getByText('3. AI & Marketing')).toBeInTheDocument()
    expect(screen.getByText('4. Médias')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /soumettre/i })
    expect(button).toBeInTheDocument()
  })
})
