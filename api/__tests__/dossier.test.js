import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../dossier.js';
import formidable from 'formidable';

vi.mock('../emailService.js', () => ({
  sendConfirmationEmail: vi.fn(),
  validateEmail: vi.fn().mockReturnValue(true),
}));

vi.mock('formidable', () => ({
  default: vi.fn(),
}));

describe('Dossier API Endpoint Integration', () => {
  let mockFormParse;
  let mockSendEmail;
  let originalEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    
    const emailModule = await import('../emailService.js');
    mockSendEmail = emailModule.sendConfirmationEmail;
    
    mockFormParse = vi.fn();
    formidable.mockReturnValue({
      parse: mockFormParse,
    });
    
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
          address: '123 Rue Test, Paris',
          price: '500000',
          targetBuyer: 'jeune_famille',
          photoCount: 2,
        },
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          agentEmail: 'agent@example.com',
          propertyType: 'appartement',
          address: '123 Rue Test, Paris',
        }),
        2
      );
    });

    it('should continue processing even if email fails', async () => {
      mockFormParse.mockResolvedValue([validFormData, mockFiles]);
      mockSendEmail.mockResolvedValue({ 
        success: false, 
        error: 'Email service unavailable' 
      });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

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
      mockFormParse.mockResolvedValue([validFormData, {}]);
      mockSendEmail.mockResolvedValue({ success: true, id: 'email_no_photos' });

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

      mockFormParse.mockResolvedValue([minimalFormData, {}]);
      mockSendEmail.mockResolvedValue({ success: true, id: 'email_minimal' });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          agentEmail: 'minimal@example.com',
          propertyType: 'maison',
          roomCount: null,
          livingArea: null,
          constructionYear: null,
          keyPoints: null,
          propertyDescription: null,
        }),
        0
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
      mockFormParse.mockResolvedValue([validFormData, mockFiles]);
      mockSendEmail.mockRejectedValue(new Error('Network error'));

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.emailSent).toBe(false);
    });

    it('should log successful email send', async () => {
      mockFormParse.mockResolvedValue([validFormData, {}]);
      mockSendEmail.mockResolvedValue({ success: true, id: 'email_log' });

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
      mockFormParse.mockResolvedValue([validFormData, {}]);
      
      mockSendEmail.mockResolvedValue({ success: true });
      const { req: req1, res: res1 } = createMocks({ method: 'POST' });
      await handler(req1, res1);
      let responseData = JSON.parse(res1._getData());
      expect(responseData.emailSent).toBe(true);

      mockSendEmail.mockResolvedValue({ success: false, error: 'Failed' });
      const { req: req2, res: res2 } = createMocks({ method: 'POST' });
      await handler(req2, res2);
      responseData = JSON.parse(res2._getData());
      expect(responseData.emailSent).toBe(false);
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