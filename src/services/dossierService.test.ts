import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { 
  submitDossier, 
  submitDossierWithRetry, 
  DossierServiceError,
  type DossierPostResponse 
} from './dossierService';

// Mock environment variable
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');

// Setup MSW server
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('dossierService', () => {
  describe('submitDossier', () => {
    it('should successfully submit dossier form data', async () => {
      const mockResponse: DossierPostResponse = {
        message: 'Dossier successfully received',
        timestamp: '2025-08-27T10:00:00Z',
        data: {
          agentEmail: 'agent@example.com',
          propertyType: 'appartement',
          address: '123 Rue Example',
          price: '500000',
          targetBuyer: 'jeune_famille',
          roomCount: '3.5',
          livingArea: '85',
          constructionYear: '2000',
          keyPoints: 'Vue sur le lac',
          propertyDescription: 'Belle propriété',
          photoCount: 2,
        },
      };

      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(mockResponse, { status: 201 });
        })
      );

      const formData = new FormData();
      formData.append('agentEmail', 'agent@example.com');
      formData.append('propertyType', 'appartement');
      formData.append('address', '123 Rue Example');
      formData.append('price', '500000');
      formData.append('targetBuyer', 'jeune_famille');

      const result = await submitDossier(formData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing required fields error (400)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { 
              error: 'Missing required fields',
              missingFields: ['propertyType', 'address'] 
            },
            { status: 400 }
          );
        })
      );

      const formData = new FormData();
      formData.append('agentEmail', 'agent@example.com');

      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Missing required fields: propertyType, address');
    });

    it('should handle file size limit error (413)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { error: 'File size exceeds maximum allowed' },
            { status: 413 }
          );
        })
      );

      const formData = new FormData();
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg');
      formData.append('photos', largeFile);

      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('File(s) too large. Maximum size is 10MB per file, 20 files total.');
    });

    it('should handle invalid file type error (415)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { 
              error: 'Unsupported media type',
              file: 'document.pdf',
              allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
            },
            { status: 415 }
          );
        })
      );

      const formData = new FormData();
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      formData.append('photos', pdfFile);

      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Invalid file type: document.pdf. Only JPEG, PNG, and WebP images are allowed.');
    });

    it('should handle rate limit error (429)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          );
        })
      );

      const formData = new FormData();
      
      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Too many requests. Please try again later.');
    });

    it('should handle server error (500)', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      const formData = new FormData();
      
      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Server error: Internal server error');
    });

    it('should handle network errors', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.error();
        })
      );

      const formData = new FormData();
      
      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Network error. Please check your connection and try again.');
    });

    it('should throw error when VITE_API_URL is not configured', async () => {
      // Temporarily remove the environment variable
      vi.stubEnv('VITE_API_URL', '');

      const formData = new FormData();
      
      await expect(submitDossier(formData)).rejects.toThrow(DossierServiceError);
      await expect(submitDossier(formData)).rejects.toThrow('Application is not configured correctly.');

      // Restore the environment variable
      vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');
    });
  });

  describe('submitDossierWithRetry', () => {
    it('should retry on server errors and succeed', async () => {
      let attemptCount = 0;
      
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          attemptCount++;
          
          if (attemptCount < 3) {
            return HttpResponse.json(
              { error: 'Service temporarily unavailable' },
              { status: 503 }
            );
          }
          
          return HttpResponse.json(
            {
              message: 'Dossier successfully received',
              timestamp: '2025-08-27T10:00:00Z',
              data: {
                agentEmail: 'agent@example.com',
                propertyType: 'appartement',
                address: '123 Rue Example',
                price: '500000',
                targetBuyer: 'jeune_famille',
                photoCount: 0,
              },
            },
            { status: 201 }
          );
        })
      );

      const formData = new FormData();
      formData.append('agentEmail', 'agent@example.com');
      formData.append('propertyType', 'appartement');
      formData.append('address', '123 Rue Example');
      formData.append('price', '500000');
      formData.append('targetBuyer', 'jeune_famille');

      const result = await submitDossierWithRetry(formData, 3, 10); // Short delay for testing
      
      expect(attemptCount).toBe(3);
      expect(result.message).toBe('Dossier successfully received');
    });

    it('should not retry on client errors (4xx)', async () => {
      let attemptCount = 0;
      
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          attemptCount++;
          return HttpResponse.json(
            { error: 'Bad request' },
            { status: 400 }
          );
        })
      );

      const formData = new FormData();
      
      await expect(submitDossierWithRetry(formData, 3, 10)).rejects.toThrow(DossierServiceError);
      expect(attemptCount).toBe(1); // Should not retry on 4xx errors
    });

    it('should fail after maximum retries', async () => {
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          return HttpResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
          );
        })
      );

      const formData = new FormData();
      
      await expect(submitDossierWithRetry(formData, 2, 10)).rejects.toThrow(DossierServiceError);
      await expect(submitDossierWithRetry(formData, 2, 10)).rejects.toThrow('Server error: Service unavailable');
    });

    it('should use exponential backoff for retries', async () => {
      let attemptTimestamps: number[] = [];
      
      server.use(
        http.post('http://localhost:3000/api/dossier', () => {
          attemptTimestamps.push(Date.now());
          
          if (attemptTimestamps.length < 3) {
            return HttpResponse.json(
              { error: 'Service temporarily unavailable' },
              { status: 503 }
            );
          }
          
          return HttpResponse.json(
            {
              message: 'Success',
              timestamp: '2025-08-27T10:00:00Z',
              data: {
                agentEmail: 'agent@example.com',
                propertyType: 'appartement',
                address: '123 Rue Example',
                price: '500000',
                targetBuyer: 'jeune_famille',
                photoCount: 0,
              },
            },
            { status: 201 }
          );
        })
      );

      const formData = new FormData();
      formData.append('agentEmail', 'agent@example.com');
      formData.append('propertyType', 'appartement');
      formData.append('address', '123 Rue Example');
      formData.append('price', '500000');
      formData.append('targetBuyer', 'jeune_famille');

      await submitDossierWithRetry(formData, 3, 100); // 100ms initial delay
      
      // Check that delays are increasing (exponential backoff)
      expect(attemptTimestamps.length).toBe(3);
      
      // Second attempt should be ~100ms after first
      const firstDelay = attemptTimestamps[1] - attemptTimestamps[0];
      expect(firstDelay).toBeGreaterThanOrEqual(95); // Allow some variance
      expect(firstDelay).toBeLessThan(150);
      
      // Third attempt should be ~200ms after second (doubled)
      const secondDelay = attemptTimestamps[2] - attemptTimestamps[1];
      expect(secondDelay).toBeGreaterThanOrEqual(195);
      expect(secondDelay).toBeLessThan(250);
    });
  });
});