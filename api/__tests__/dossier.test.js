import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../dossier.js';

vi.mock('../emailService.js', () => ({
  sendConfirmationEmail: vi.fn(),
  validateEmail: vi.fn(() => true),
}));

vi.mock('../aiServiceGemini.js', () => ({
  generateAIContent: vi.fn(),
}));

// Create a shared mock parse function
const mockFormParse = vi.fn();

vi.mock('formidable', () => {
  return {
    default: vi.fn(() => ({
      parse: mockFormParse,
    })),
  };
});

describe('Dossier API Endpoint Integration', () => {
  let mockSendEmail;
  let mockGenerateAI;
  let originalEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    const emailModule = await import('../emailService.js');
    mockSendEmail = emailModule.sendConfirmationEmail;
    mockSendEmail.mockClear();
    
    const aiModule = await import('../aiServiceGemini.js');
    mockGenerateAI = aiModule.generateAIContent;
    mockGenerateAI.mockClear();
    
    // Clear the shared mockFormParse
    mockFormParse.mockClear();
    
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('POST /api/dossier with email integration', () => {
    const validFormData = {
      agentEmail: ['agent@example.com'],
      propertyType: ['appartement'],
      address: ['123 Rue Test, Paris'],
      price: ['500000'],
      targetBuyer: ['jeune_famille'],
      roomCount: ['3'],
      livingArea: ['75'],
      constructionYear: ['2020'],
      keyPoints: ['Points clés'],
      propertyDescription: ['Description détaillée'],
    };

    const mockFiles = {
      photos: [
        {
          originalFilename: 'photo1.jpg',
          mimetype: 'image/jpeg',
          size: 1024000,
        },
        {
          originalFilename: 'photo2.jpg',
          mimetype: 'image/jpeg',
          size: 2048000,
        },
      ],
    };

    it('should successfully process form and send confirmation email', async () => {
      mockFormParse.mockResolvedValue([validFormData, mockFiles]);
      mockSendEmail.mockResolvedValue({ success: true, id: 'email_123' });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toMatchObject({
        message: 'Dossier reçu avec succès',
        emailSent: true,
        data: {
          agentEmail: 'agent@example.com',
          propertyType: 'appartement',
          photoCount: 2,
        },
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          agentEmail: 'agent@example.com',
          propertyType: 'appartement',
        }),
        2,
        expect.any(Object)
      );
    });

    it('should continue processing even if email fails', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, mockFiles]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ 
        success: false, 
        error: 'Email service unavailable' 
      }));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      if (res._getStatusCode() !== 201) {
        console.log('Test failed with status:', res._getStatusCode());
        console.log('Test failed with response:', res._getData());
      }

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData).toMatchObject({
        message: 'Dossier reçu avec succès',
        emailSent: false,
        data: {
          photoCount: 2,
        },
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send confirmation email:',
        'Email service unavailable'
      );
    });

    it('should handle form with no photos', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, {}]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true, id: 'email_no_photos' }));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.data.photoCount).toBe(0);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.anything(),
        0
      );
    });

    it('should handle minimal required fields', async () => {
      const minimalFormData = {
        agentEmail: ['minimal@example.com'],
        propertyType: ['maison'],
        address: ['456 Avenue Minimal'],
        price: ['300000'],
        targetBuyer: ['investisseur'],
      };

      mockFormParse.mockImplementation(() => Promise.resolve([minimalFormData, {}]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true, id: 'email_minimal' }));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          agentEmail: 'minimal@example.com',
          propertyType: 'maison',
        }),
        0,
        expect.anything()
      );
    });

    it('should validate email format before sending', async () => {
      const emailModule = await import('../emailService.js');
      emailModule.validateEmail.mockReturnValue(false);

      mockFormParse.mockResolvedValue([
        { ...validFormData, agentEmail: ['invalid-email'] },
        {},
      ]);

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe("Format d'email invalide");
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should handle email service exception', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, mockFiles]));
      mockSendEmail.mockImplementation(() => Promise.reject(new Error('Network error')));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.emailSent).toBe(false);
    });

    it('should log successful email send', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, {}]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true, id: 'email_log' }));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(console.log).toHaveBeenCalledWith(
        'Confirmation email sent successfully to:',
        'agent@example.com'
      );
    });

    it('should include email status in response', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, {}]));
      
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true }));
      const { req: req1, res: res1 } = createMocks({ method: 'POST' });
      await handler(req1, res1);
      let responseData = JSON.parse(res1._getData());
      expect(responseData.emailSent).toBe(true);

      mockFormParse.mockImplementation(() => Promise.resolve([validFormData, {}]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: false, error: 'Failed' }));
      const { req: req2, res: res2 } = createMocks({ method: 'POST' });
      await handler(req2, res2);
      responseData = JSON.parse(res2._getData());
      expect(responseData.emailSent).toBe(false);
    });
  });

  describe('AI Integration Tests', () => {
    beforeEach(async () => {
      // Reset mocks for AI integration tests
      vi.clearAllMocks();
      process.env.GEMINI_API_KEY = 'test-api-key';
      
      // Clear the shared mockFormParse for AI tests
      mockFormParse.mockClear();
    });

    const aiTestFormData = {
      agentEmail: ['agent@example.com'],
      propertyType: ['Maison'],
      address: ['123 Rue Test, Paris'],
      propertyLocation: ['Paris 16ème'],
      price: ['500000'],
      targetBuyer: ['jeune_famille'],
      roomCount: ['5'],
      bedroomCount: ['3'],
      bathroomCount: ['2'],
      livingArea: ['120'],
      heatingType: ['Gaz'],
      energyClass: ['B'],
      ghgClass: ['C'],
      hasGarage: ['true'],
      hasGarden: ['true'],
      hasBalcony: ['true'],
      features: ['Rénové, Lumineux'],
      keyPoints: ['Proche écoles'],
    };

    it('should generate AI content when Gemini API key is configured', async () => {
      const mockAIContent = {
        narrative: 'Generated narrative',
        facebook: 'FB post',
        instagram: 'IG post',
        linkedin: 'LI post',
        cached: false,
        generationTime: 1500,
        rateLimit: { remaining: 9, reset: '2024-01-01T00:00:00Z' }
      };

      // Use mockImplementation to avoid interference
      mockFormParse.mockImplementation(() => Promise.resolve([aiTestFormData, {}]));
      mockGenerateAI.mockImplementation(() => Promise.resolve(mockAIContent));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true }));

      const { req, res } = createMocks({
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await handler(req, res);


      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.aiContent).toMatchObject({
        narrative: 'Generated narrative',
        socialMedia: {
          facebook: 'FB post',
          instagram: 'IG post',
          linkedin: 'LI post'
        },
        cached: false,
        generationTime: 1500
      });

      expect(mockGenerateAI).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'Maison',
          targetBuyer: 'jeune_famille',
          hasGarage: true,
          hasGarden: true
        }),
        '192.168.1.1'
      );
    });

    it('should handle AI generation failures gracefully', async () => {
      mockFormParse.mockImplementation(() => Promise.resolve([aiTestFormData, {}]));
      mockGenerateAI.mockImplementation(() => Promise.reject(new Error('AI service unavailable')));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true }));

      const { req, res } = createMocks({ method: 'POST' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      
      expect(responseData.aiContent).toBeNull();
      expect(responseData.aiGenerationError).toBe('AI service unavailable');
      expect(responseData.emailSent).toBe(true);
    });

    it('should handle AI rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      rateLimitError.retryAfter = 3600;

      mockFormParse.mockImplementation(() => Promise.resolve([aiTestFormData, {}]));
      mockGenerateAI.mockImplementation(() => Promise.reject(rateLimitError));

      const { req, res } = createMocks({ method: 'POST' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(429);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('Trop de demandes');
      expect(responseData.retryAfter).toBe(3600);
    });

    it('should use cached AI content when available', async () => {
      const cachedContent = {
        narrative: 'Cached narrative',
        facebook: 'Cached FB',
        instagram: 'Cached IG',
        linkedin: 'Cached LI',
        cached: true,
        generationTime: 0,
        rateLimit: { remaining: 8 }
      };

      mockFormParse.mockImplementation(() => Promise.resolve([aiTestFormData, {}]));
      mockGenerateAI.mockImplementation(() => Promise.resolve(cachedContent));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true }));

      const { req, res } = createMocks({ method: 'POST' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.aiContent.cached).toBe(true);
      expect(responseData.aiContent.generationTime).toBe(0);
    });

    it('should skip AI generation when API key not configured', async () => {
      delete process.env.GEMINI_API_KEY;

      mockFormParse.mockImplementation(() => Promise.resolve([aiTestFormData, {}]));
      mockSendEmail.mockImplementation(() => Promise.resolve({ success: true }));

      const { req, res } = createMocks({ method: 'POST' });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.aiContent).toBeNull();
      expect(mockGenerateAI).not.toHaveBeenCalled();
    });
  });

  describe('Error handling during email integration', () => {
    it('should handle missing required fields', async () => {
      const incompleteData = {
        agentEmail: ['agent@example.com'],
        propertyType: ['appartement'],
      };

      mockFormParse.mockResolvedValue([incompleteData, {}]);

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Champs obligatoires manquants');
      expect(responseData.missingFields).toContain('address');
      expect(responseData.missingFields).toContain('price');
      expect(responseData.missingFields).toContain('targetBuyer');
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should handle form parsing errors', async () => {
      mockFormParse.mockRejectedValue(new Error('Parse error'));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe("Échec de l'analyse des données du formulaire");
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });
});