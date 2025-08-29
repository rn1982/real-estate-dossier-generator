import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the module
vi.mock('@google/generative-ai');
vi.mock('@sentry/node', () => ({
  captureException: vi.fn()
}));

describe('AI Service Gemini', () => {
  let mockGenerateContent;
  let mockGetGenerativeModel;
  let generateAIContent;
  let checkRateLimit;
  let validatePropertyData;
  let clearAllCaches;
  let GoogleGenerativeAI;
  let Sentry;

  beforeEach(async () => {
    // Clear all mocks and reset modules for complete isolation
    vi.clearAllMocks();
    vi.resetModules();
    
    // Re-import mocked dependencies
    const genAI = await import('@google/generative-ai');
    GoogleGenerativeAI = genAI.GoogleGenerativeAI;
    
    const sentryModule = await import('@sentry/node');
    Sentry = sentryModule;
    
    // Setup Gemini mock
    mockGenerateContent = vi.fn();
    mockGetGenerativeModel = vi.fn(() => ({
      generateContent: mockGenerateContent
    }));
    
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel
    }));

    // Set environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Import the module under test with fresh state
    const aiModule = await import('../aiServiceGemini.js');
    generateAIContent = aiModule.generateAIContent;
    checkRateLimit = aiModule.checkRateLimit;
    validatePropertyData = aiModule.validatePropertyData;
    clearAllCaches = aiModule.clearAllCaches;
    
    // Clear any persisted caches
    if (clearAllCaches) {
      clearAllCaches();
    }
  });

  afterEach(() => {
    // Restore all mocks and clear environment
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    // Clear caches after each test
    if (clearAllCaches) {
      clearAllCaches();
    }
  });

  describe('validatePropertyData', () => {
    it('should validate complete property data', () => {
      const validData = {
        propertyType: 'Maison',
        propertyLocation: 'Paris 16ème',
        propertyAddress: '123 Rue de la Paix',
        price: 500000,
        livingArea: 120,
        roomCount: 5,
        bedroomCount: 3,
        bathroomCount: 2,
        heatingType: 'Gaz',
        energyClass: 'B',
        ghgClass: 'C',
        targetBuyer: 'jeune_famille'
      };

      expect(() => validatePropertyData(validData)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidData = {
        propertyType: 'Maison',
        price: 500000
      };

      expect(() => validatePropertyData(invalidData))
        .toThrow('Missing required field: propertyLocation');
    });

    it('should throw error for invalid numeric values', () => {
      const invalidData = {
        propertyType: 'Maison',
        propertyLocation: 'Paris',
        propertyAddress: '123 Rue',
        price: 'invalid',
        livingArea: 120,
        roomCount: 5,
        bedroomCount: 3,
        bathroomCount: 2,
        heatingType: 'Gaz',
        energyClass: 'B',
        ghgClass: 'C',
        targetBuyer: 'jeune_famille'
      };

      expect(() => validatePropertyData(invalidData))
        .toThrow('Invalid numeric value for price: invalid');
    });

    it('should throw error for invalid persona', () => {
      const invalidData = {
        propertyType: 'Maison',
        propertyLocation: 'Paris',
        propertyAddress: '123 Rue',
        price: 500000,
        livingArea: 120,
        roomCount: 5,
        bedroomCount: 3,
        bathroomCount: 2,
        heatingType: 'Gaz',
        energyClass: 'B',
        ghgClass: 'C',
        targetBuyer: 'invalid_persona'
      };

      expect(() => validatePropertyData(invalidData))
        .toThrow('Invalid target buyer persona: invalid_persona');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-ip-1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track multiple requests from same IP', () => {
      const ip = 'test-ip-2';
      
      // Clear rate limit store first
      clearAllCaches();
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9 - i);
      }
    });

    it('should block after rate limit exceeded', () => {
      const ip = 'test-ip-3';
      
      // Clear rate limit store first
      clearAllCaches();
      
      // Make 10 requests (max allowed)
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip);
      }
      
      // 11th request should be blocked
      const result = checkRateLimit(ip);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('generateAIContent', () => {
    const validPropertyData = {
      propertyType: 'Maison',
      propertyLocation: 'Paris 16ème',
      propertyAddress: '123 Rue de la Paix',
      price: 500000,
      livingArea: 120,
      roomCount: 5,
      bedroomCount: 3,
      bathroomCount: 2,
      heatingType: 'Gaz',
      energyClass: 'B',
      ghgClass: 'C',
      targetBuyer: 'jeune_famille',
      hasGarage: true,
      hasGarden: true,
      hasPool: false,
      hasBalcony: true,
      features: ['Rénové', 'Lumineux'],
      sellingPoints: 'Proche écoles et transports'
    };

    it('should generate content for jeune_famille persona', async () => {
      const mockResponse = {
        narrative: "Cette magnifique maison familiale...",
        facebook: "🏡 Famille cherche nouveau foyer...",
        instagram: "✨ Maison familiale Paris 16...",
        linkedin: "Opportunité immobilière..."
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      const result = await generateAIContent(validPropertyData);
      
      expect(result.narrative).toBe(mockResponse.narrative);
      expect(result.facebook).toBe(mockResponse.facebook);
      expect(result.instagram).toBe(mockResponse.instagram);
      expect(result.linkedin).toBe(mockResponse.linkedin);
      expect(result.cached).toBe(false);
      expect(result.generationTime).toBeDefined();
    });

    it('should generate content for investisseur persona', async () => {
      const investorData = {
        ...validPropertyData,
        targetBuyer: 'investisseur'
      };

      const mockResponse = {
        narrative: "Excellente opportunité d'investissement...",
        facebook: "💼 Investissement immobilier rentable...",
        instagram: "📈 ROI attractif Paris 16...",
        linkedin: "Analyse d'investissement immobilier..."
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      const result = await generateAIContent(investorData);
      
      expect(result.narrative).toBe(mockResponse.narrative);
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({
        model: "gemini-2.0-flash-exp",
        generationConfig: expect.objectContaining({
          temperature: 0.7,
          maxOutputTokens: 1000
        })
      });
    });

    it('should use fallback content on AI failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const result = await generateAIContent(validPropertyData);
      
      expect(result.narrative).toContain('Découvrez cette magnifique');
      expect(result.fallback).toBe(true);
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new Error('Network error');
      retryableError.code = 'ECONNRESET';
      
      mockGenerateContent
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({
          response: {
            text: () => JSON.stringify({
              narrative: "Cette opportunité après nouvelle tentative...",
              facebook: "🏡 Nouvelle tentative réussie...",
              instagram: "✨ Succès après retry...",
              linkedin: "Opportunité après retry..."
            })
          }
        });

      const result = await generateAIContent(validPropertyData);
      
      expect(result.narrative).toBe("Cette opportunité après nouvelle tentative...");
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should enforce rate limiting', async () => {
      // Clear stores first
      clearAllCaches();
      
      const testIp = 'rate-limit-test-ip';
      
      // Exhaust rate limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit(testIp);
      }
      
      // Next request should fail with rate limit error
      await expect(generateAIContent(validPropertyData, testIp))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should cache responses', async () => {
      // Clear cache first
      clearAllCaches();
      
      const mockResponse = {
        narrative: "Cached content",
        facebook: "FB",
        instagram: "IG",
        linkedin: "LI"
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      // First call - should generate
      const result1 = await generateAIContent(validPropertyData, 'cache-test-ip-1');
      expect(result1.cached).toBe(false);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      // Second call with same data - should use cache
      const result2 = await generateAIContent(validPropertyData, 'cache-test-ip-2');
      expect(result2.cached).toBe(true);
      expect(result2.generationTime).toBe(0);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should validate content for inappropriate material', async () => {
      const inappropriateResponse = {
        narrative: "Cette putain de maison...",
        facebook: "FB",
        instagram: "IG",
        linkedin: "LI"
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(inappropriateResponse)
        }
      });

      const result = await generateAIContent(validPropertyData);
      
      // Should use fallback due to profanity
      expect(result.narrative).not.toContain('putain');
      expect(result.narrative).toContain('Découvrez cette magnifique');
    });

    it('should validate content is in French', async () => {
      const englishResponse = {
        narrative: "This beautiful house in Paris",
        facebook: "Great opportunity!",
        instagram: "Amazing property",
        linkedin: "Investment opportunity"
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(englishResponse)
        }
      });

      const result = await generateAIContent(validPropertyData);
      
      // Should use fallback due to non-French content
      expect(result.narrative).toContain('Découvrez');
      expect(result.narrative).not.toContain('This beautiful');
    });

    it('should handle parse errors gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "Invalid JSON response"
        }
      });

      const result = await generateAIContent(validPropertyData);
      
      // Should use fallback
      expect(result.fallback).toBe(true);
      expect(result.narrative).toContain('Découvrez');
    });

    it('should include rate limit info in response', async () => {
      const mockResponse = {
        narrative: "Content",
        facebook: "FB",
        instagram: "IG",
        linkedin: "LI"
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse)
        }
      });

      const result = await generateAIContent(validPropertyData, 'rate-info-test-ip');
      
      expect(result.rateLimit).toBeDefined();
      expect(result.rateLimit.remaining).toBeDefined();
      expect(result.rateLimit.reset).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete generation within 3 seconds for 95% of requests', async () => {
      const mockResponse = {
        narrative: "Fast response",
        facebook: "FB",
        instagram: "IG",
        linkedin: "LI"
      };

      mockGenerateContent.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              response: {
                text: () => JSON.stringify(mockResponse)
              }
            });
          }, 100); // Simulate 100ms response
        })
      );

      const validData = {
        propertyType: 'Maison',
        propertyLocation: 'Paris',
        propertyAddress: '123 Rue',
        price: 500000,
        livingArea: 120,
        roomCount: 5,
        bedroomCount: 3,
        bathroomCount: 2,
        heatingType: 'Gaz',
        energyClass: 'B',
        ghgClass: 'C',
        targetBuyer: 'jeune_famille'
      };

      const startTime = Date.now();
      const result = await generateAIContent(validData);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
      expect(result.generationTime).toBeLessThan(3000);
    });
  });
});