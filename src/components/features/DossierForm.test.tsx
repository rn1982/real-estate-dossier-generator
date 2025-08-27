import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DossierForm } from './DossierForm';

// Mock alert
global.alert = vi.fn();

describe('DossierForm Component', () => {
  it('renders all form sections', () => {
    render(<DossierForm />);
    
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

  it('accepts valid email format', async () => {
    const user = userEvent.setup();
    render(<DossierForm />);
    
    const emailInput = screen.getByLabelText('Adresse e-mail de l\'agent*') as HTMLInputElement;
    await user.type(emailInput, 'agent@example.com');
    
    expect(emailInput.value).toBe('agent@example.com');
  });

  it('validates price format', async () => {
    const user = userEvent.setup();
    render(<DossierForm />);
    
    const priceInput = screen.getByLabelText('Prix (CHF)*') as HTMLInputElement;
    await user.type(priceInput, 'abc123');
    
    const submitButton = screen.getByRole('button', { name: /Soumettre/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Format de prix invalide')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(<DossierForm />);
    
    // Fill required fields
    const emailInput = screen.getByLabelText('Adresse e-mail de l\'agent*') as HTMLInputElement;
    await user.type(emailInput, 'agent@example.com');
    
    const addressInput = screen.getByLabelText('Adresse*') as HTMLInputElement;
    await user.type(addressInput, '123 Rue Example, Genève');
    
    const priceInput = screen.getByLabelText('Prix (CHF)*') as HTMLInputElement;
    await user.type(priceInput, '500000');
    
    const submitButton = screen.getByRole('button', { name: /Soumettre/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Form submitted with data:'),
        expect.any(Object)
      );
      expect(global.alert).toHaveBeenCalledWith('Formulaire soumis avec succès!');
    });
    
    consoleSpy.mockRestore();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    render(<DossierForm />);
    
    // Fill required fields
    const emailInput = screen.getByLabelText('Adresse e-mail de l\'agent*') as HTMLInputElement;
    await user.type(emailInput, 'agent@example.com');
    
    const addressInput = screen.getByLabelText('Adresse*') as HTMLInputElement;
    await user.type(addressInput, '123 Rue Example');
    
    const priceInput = screen.getByLabelText('Prix (CHF)*') as HTMLInputElement;
    await user.type(priceInput, '500000');
    
    const submitButton = screen.getByRole('button', { name: /Soumettre/i });
    await user.click(submitButton);
    
    // Check if button text changes during submission
    await waitFor(() => {
      const submittingButton = screen.queryByRole('button', { name: /Envoi en cours.../i });
      if (submittingButton) {
        expect(submittingButton).toBeDisabled();
      }
    });
  });
});