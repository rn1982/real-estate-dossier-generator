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
  // Use environment variable or default to /api/dossier for Vercel deployment
  const apiUrl = import.meta.env.VITE_API_URL || '/api/dossier';
  
  if (!apiUrl) {
    console.error("VITE_API_URL is not defined.");
    throw new DossierServiceError("Application is not configured correctly.", 500);
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorData = data as DossierErrorResponse;
      let errorMessage = errorData.error || 'API request failed';
      
      // Provide more specific error messages based on status
      switch (response.status) {
        case 400:
          if (errorData.missingFields) {
            errorMessage = `Missing required fields: ${errorData.missingFields.join(', ')}`;
          }
          break;
        case 413:
          errorMessage = 'File(s) too large. Maximum size is 10MB per file, 20 files total.';
          break;
        case 415:
          errorMessage = `Invalid file type: ${errorData.file}. Only JPEG, PNG, and WebP images are allowed.`;
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${errorMessage}`;
      }
      
      throw new DossierServiceError(errorMessage, response.status, undefined, errorData);
    }
    
    return data as DossierPostResponse;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new DossierServiceError(
        'Network error. Please check your connection and try again.',
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
      'An unexpected error occurred. Please try again.',
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
  
  throw lastError || new DossierServiceError('Failed after maximum retries', 500, undefined);
};