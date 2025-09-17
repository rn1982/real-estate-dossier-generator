import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDossierForm } from './useDossierForm';
import { submitDossierWithRetry, DossierServiceError, type DossierPostResponse } from '@/services/dossierService';

// Mock the service
vi.mock('@/services/dossierService', () => ({
  submitDossierWithRetry: vi.fn(),
  DossierServiceError: class DossierServiceError extends Error {
    constructor(message: string, public status?: number, public code?: string) {
      super(message);
      this.name = 'DossierServiceError';
    }
  },
}));

// Mock toast context
vi.mock('@/contexts/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock form persistence
vi.mock('./useFormPersistence', () => ({
  useFormPersistence: () => ({
    clearFormAndStorage: vi.fn(),
  }),
}));

describe('useDossierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDossierForm());
    
    expect(result.current.form.getValues()).toEqual({
      agentEmail: '',
      propertyType: 'appartement',
      address: '',
      price: '',
      targetBuyer: 'jeune_famille',
      photos: [],
    });
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBe(null);
    expect(result.current.submitSuccess).toBe(false);
  });

  it('should handle successful form submission', async () => {
    const mockResponse: DossierPostResponse = {
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: { 
        agentEmail: 'test@example.com',
        propertyType: 'appartement',
        address: '123 Test Street',
        price: '500000',
        targetBuyer: 'jeune_famille',
        photoCount: 3 
      },
    };
    
    vi.mocked(submitDossierWithRetry).mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.submitSuccess).toBe(true);
      expect(result.current.submitError).toBe(null);
      expect(result.current.isSubmitting).toBe(false);
    });
    
    expect(submitDossierWithRetry).toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const { result } = renderHook(() => useDossierForm(), );
    
    // Set invalid email
    act(() => {
      result.current.form.setValue('agentEmail', 'invalid-email');
    });
    
    // Trigger validation
    await act(async () => {
      await result.current.form.trigger('agentEmail');
    });
    
    const errors = result.current.form.formState.errors;
    expect(errors.agentEmail?.message).toBe('Adresse e-mail invalide');
  });

  it('should handle API error 400 - Bad Request', async () => {
    const error = new DossierServiceError('Bad request', 400, undefined);
    vi.mocked(submitDossierWithRetry).mockRejectedValue(error);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.submitSuccess).toBe(false);
      expect(result.current.submitError).toBe('Veuillez vérifier les informations saisies et réessayer.');
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('should handle API error 413 - File Too Large', async () => {
    const error = new DossierServiceError('File too large', 413, undefined);
    vi.mocked(submitDossierWithRetry).mockRejectedValue(error);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.submitError).toBe('Un ou plusieurs fichiers dépassent la limite de taille (10 MB par fichier).');
    });
  });

  it('should handle network error', async () => {
    const error = new DossierServiceError('Network error', 0, 'NETWORK_ERROR');
    vi.mocked(submitDossierWithRetry).mockRejectedValue(error);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.submitError).toBe('Vérifiez votre connexion internet et réessayez.');
    });
  });

  it('should handle timeout error', async () => {
    const error = new DossierServiceError('Timeout', 0, 'TIMEOUT');
    vi.mocked(submitDossierWithRetry).mockRejectedValue(error);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.submitError).toBe('La requête a pris trop de temps. Veuillez vérifier votre connexion et réessayer.');
    });
  });

  it('should reset form after successful submission', async () => {
    const mockResponse: DossierPostResponse = {
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: { 
        agentEmail: 'test@example.com',
        propertyType: 'appartement',
        address: '123 Test Street',
        price: '500000',
        targetBuyer: 'jeune_famille',
        photoCount: 0 
      },
    };
    
    vi.mocked(submitDossierWithRetry).mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    // Set form values
    act(() => {
      result.current.form.setValue('agentEmail', 'test@example.com');
      result.current.form.setValue('address', '123 Test Street');
    });
    
    const formData = result.current.form.getValues();
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    await waitFor(() => {
      expect(result.current.form.getValues().agentEmail).toBe('');
      expect(result.current.form.getValues().address).toBe('');
    });
  });

  it('should set isSubmitting to true during submission', async () => {
    let resolvePromise: (value: DossierPostResponse) => void;
    const promise = new Promise<DossierPostResponse>((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(submitDossierWithRetry).mockReturnValue(promise);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'appartement' as const,
      address: '123 Test Street',
      price: '500000',
      targetBuyer: 'jeune_famille' as const,
      photos: [],
    };
    
    // Start submission
    act(() => {
      result.current.handleSubmit(formData);
    });
    
    // Check isSubmitting is true
    expect(result.current.isSubmitting).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolvePromise({
        message: 'Success',
        timestamp: new Date().toISOString(),
        data: { 
          agentEmail: 'test@example.com',
          propertyType: 'appartement',
          address: '123 Test Street',
          price: '500000',
          targetBuyer: 'jeune_famille',
          photoCount: 0 
        }
      });
      await promise;
    });
    
    // Check isSubmitting is false after completion
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  it('should validate required fields', async () => {
    const { result } = renderHook(() => useDossierForm(), );
    
    // Try to submit with empty required fields
    await act(async () => {
      await result.current.form.handleSubmit(() => {})();
    });
    
    const errors = result.current.form.formState.errors;
    
    expect(errors.agentEmail?.message).toBe('Adresse e-mail requise');
    expect(errors.address?.message).toBe('Adresse requise');
    expect(errors.price?.message).toBe('Prix requis');
  });

  it('should validate price format', async () => {
    const { result } = renderHook(() => useDossierForm(), );
    
    // Set invalid price format
    act(() => {
      result.current.form.setValue('price', 'abc123');
    });
    
    await act(async () => {
      await result.current.form.trigger('price');
    });
    
    const errors = result.current.form.formState.errors;
    expect(errors.price?.message).toBe('Format de prix invalide');
  });

  it('should handle FormData construction correctly', async () => {
    const mockResponse: DossierPostResponse = {
      message: 'Success',
      timestamp: new Date().toISOString(),
      data: { 
        agentEmail: 'test@example.com',
        propertyType: 'appartement',
        address: '123 Test Street',
        price: '500000',
        targetBuyer: 'jeune_famille',
        photoCount: 2 
      },
    };
    
    vi.mocked(submitDossierWithRetry).mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useDossierForm(), );
    
    const file1 = new File(['content1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'photo2.jpg', { type: 'image/jpeg' });
    
    const formData = {
      agentEmail: 'test@example.com',
      propertyType: 'maison' as const,
      address: '456 Test Avenue',
      price: '750000',
      roomCount: 4.5,
      livingArea: 120,
      constructionYear: 2020,
      keyPoints: 'Near school',
      propertyDescription: 'Beautiful house',
      targetBuyer: 'investisseur' as const,
      photos: [file1, file2],
    };
    
    await act(async () => {
      await result.current.handleSubmit(formData);
    });
    
    expect(submitDossierWithRetry).toHaveBeenCalledWith(expect.any(FormData));
    
    // Verify FormData was constructed
    const calledFormData = vi.mocked(submitDossierWithRetry).mock.calls[0][0];
    expect(calledFormData).toBeInstanceOf(FormData);
  });
});
