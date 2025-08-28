export interface DossierPostResponse {
  message: string;
  timestamp: string;
  data: {
    agentEmail: string;
    propertyType: string;
    address: string;
    price: string;
    targetBuyer: string;
    roomCount?: string;
    livingArea?: string;
    constructionYear?: string;
    keyPoints?: string;
    propertyDescription?: string;
    photoCount: number;
  };
}

export interface DossierErrorResponse {
  error: string;
  missingFields?: string[];
  validTypes?: string[];
  file?: string;
  allowedTypes?: string[];
}

export class DossierServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: DossierErrorResponse
  ) {
    super(message);
    this.name = 'DossierServiceError';
  }
}

export const submitDossier = async (formData: FormData): Promise<DossierPostResponse> => {
  // Use environment variable if set, otherwise use the default endpoint
  // Now that formidable is fixed, we can use the full endpoint
  const apiUrl = import.meta.env.VITE_API_URL || '/api/dossier';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorData = data as DossierErrorResponse;
      let errorMessage = errorData.error || 'API request failed';
      
      // Provide more specific error messages based on status (keeping original French messages from API)
      switch (response.status) {
        case 400:
          if (errorData.missingFields) {
            errorMessage = `Champs obligatoires manquants: ${errorData.missingFields.join(', ')}`;
          }
          break;
        case 413:
          errorMessage = errorData.error || 'La taille du fichier dépasse le maximum autorisé (10 Mo par fichier, 20 fichiers au total).';
          break;
        case 415:
          errorMessage = errorData.error || `Type de fichier non supporté: ${errorData.file}. Seules les images JPEG, PNG et WebP sont autorisées.`;
          break;
        case 429:
          errorMessage = 'Trop de requêtes. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = errorData.error || `Erreur serveur: ${errorMessage}`;
      }
      
      throw new DossierServiceError(errorMessage, response.status, undefined, errorData);
    }
    
    return data as DossierPostResponse;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new DossierServiceError(
        'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // Re-throw DossierServiceError
    if (error instanceof DossierServiceError) {
      throw error;
    }
    
    // Handle unexpected errors
    throw new DossierServiceError(
      'Une erreur inattendue s\'est produite. Veuillez réessayer.',
      500,
      undefined
    );
  }
};

// Retry logic with exponential backoff
export const submitDossierWithRetry = async (
  formData: FormData,
  maxRetries = 3,
  initialDelay = 1000
): Promise<DossierPostResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await submitDossier(formData);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof DossierServiceError && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new DossierServiceError('Échec après le nombre maximum de tentatives', 500, undefined);
};