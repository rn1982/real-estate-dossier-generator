import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DossierForm } from './DossierForm';
import { ToastContextProvider } from '@/contexts/ToastContext';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Setup MSW server
const server = setupServer(
  http.post('/api/dossier', () => {
    return HttpResponse.json({
      message: 'Dossier created successfully',
      data: { photoCount: 0 },
    }, { status: 201 });
  })
);

beforeEach(() => {
  server.listen();
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
});

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ToastContextProvider>
      {component}
    </ToastContextProvider>
  );
};

describe('DossierForm Integration Tests', () => {
  it('renders all form sections', () => {
    renderWithProviders(<DossierForm />);
    
    expect(screen.getByText('Formulaire de Soumission de Propriété')).toBeInTheDocument();
    expect(screen.getByText('1. Informations de l\'Agent')).toBeInTheDocument();
    expect(screen.getByText('2. Informations sur la Propriété')).toBeInTheDocument();
    expect(screen.getByText('3. AI & Marketing')).toBeInTheDocument();
    expect(screen.getByText('4. Médias')).toBeInTheDocument();
  });

  it('renders all required fields', () => {
    render(<DossierForm />);
    
    // Required fields should have asterisk
    expect(screen.getByText('Adresse e-mail de l\'agent')).toBeInTheDocument();
    expect(screen.getByText('Type de propriété')).toBeInTheDocument();
    expect(screen.getByText('Adresse')).toBeInTheDocument();
    expect(screen.getByText('Prix (CHF)')).toBeInTheDocument();
    expect(screen.getByText('Acheteur cible')).toBeInTheDocument();
  });

  it('renders all optional fields', () => {
    render(<DossierForm />);
    
    expect(screen.getByText('Nombre de pièces')).toBeInTheDocument();
    expect(screen.getByText('Surface habitable (m²)')).toBeInTheDocument();
    expect(screen.getByText('Année de construction')).toBeInTheDocument();
    expect(screen.getByText('Points de vente clés')).toBeInTheDocument();
    expect(screen.getByText('Description de la propriété')).toBeInTheDocument();
    expect(screen.getByText('Télécharger des photos')).toBeInTheDocument();
  });

  it('displays validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    render(<DossierForm />);
    
    const submitButton = screen.getByRole('button', { name: /Soumettre/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Adresse e-mail requise')).toBeInTheDocument();
      expect(screen.getByText('Adresse requise')).toBeInTheDocument();
      expect(screen.getByText('Prix requis')).toBeInTheDocument();
    });
  });

  it('successfully submits form with all required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Adresse e-mail de l'agent/), 'agent@example.com');
    await user.type(screen.getByLabelText(/^Adresse\*/), '123 Rue Example, Genève');
    await user.type(screen.getByLabelText(/Prix \(CHF\)/), '500000');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Soumettre/ });
    await user.click(submitButton);
    
    // Check loading state
    expect(screen.getByText(/Envoi en cours.../)).toBeInTheDocument();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Dossier soumis avec succès!/)).toBeInTheDocument();
    });
  });

  it('shows validation errors for missing required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Soumettre/ });
    await user.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Adresse e-mail requise/)).toBeInTheDocument();
      expect(screen.getByText(/Adresse requise/)).toBeInTheDocument();
      expect(screen.getByText(/Prix requis/)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    const emailInput = screen.getByLabelText(/Adresse e-mail de l'agent/);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger validation
    
    await waitFor(() => {
      expect(screen.getByText(/Adresse e-mail invalide/)).toBeInTheDocument();
    });
  });

  it('validates price format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    const priceInput = screen.getByLabelText(/Prix \(CHF\)/);
    await user.type(priceInput, 'abc123');
    await user.tab(); // Trigger validation
    
    await waitFor(() => {
      expect(screen.getByText(/Format de prix invalide/)).toBeInTheDocument();
    });
  });

  it('handles network error with retry option', async () => {
    server.use(
      http.post('/api/dossier', () => {
        return new Response(null, { status: 500 });
      })
    );
    
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Adresse e-mail de l'agent/), 'agent@example.com');
    await user.type(screen.getByLabelText(/^Adresse\*/), '123 Rue Example');
    await user.type(screen.getByLabelText(/Prix \(CHF\)/), '500000');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Soumettre/ });
    await user.click(submitButton);
    
    // Wait for error message with retry button
    await waitFor(() => {
      expect(screen.getByText(/Erreur serveur/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Réessayer/ })).toBeInTheDocument();
    });
  });

  it('disables all inputs during submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Adresse e-mail de l'agent/), 'agent@example.com');
    await user.type(screen.getByLabelText(/^Adresse\*/), '123 Rue Example');
    await user.type(screen.getByLabelText(/Prix \(CHF\)/), '500000');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Soumettre/ });
    await user.click(submitButton);
    
    // Check that inputs are disabled
    expect(screen.getByLabelText(/Adresse e-mail de l'agent/)).toBeDisabled();
    expect(screen.getByLabelText(/^Adresse\*/)).toBeDisabled();
    expect(screen.getByLabelText(/Prix \(CHF\)/)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Effacer le formulaire/ })).toBeDisabled();
  });

  it('clears form and storage when clicking clear button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DossierForm />);
    
    // Fill some fields
    await user.type(screen.getByLabelText(/Adresse e-mail de l'agent/), 'agent@example.com');
    await user.type(screen.getByLabelText(/^Adresse\*/), '123 Rue Example');
    
    // Click clear button
    const clearButton = screen.getByRole('button', { name: /Effacer le formulaire/ });
    await user.click(clearButton);
    
    // Check that fields are cleared
    expect(screen.getByLabelText(/Adresse e-mail de l'agent/)).toHaveValue('');
    expect(screen.getByLabelText(/^Adresse\*/)).toHaveValue('');
  });
});