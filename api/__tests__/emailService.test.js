import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendConfirmationEmail, validateEmail } from '../emailService.js';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn(),
    },
  })),
}));

describe('Email Service', () => {
  let mockSend;
  let originalEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.RESEND_API_KEY = 'test_api_key';
    process.env.EMAIL_FROM_ADDRESS = 'test@example.com';
    process.env.EMAIL_FROM_NAME = 'Test Sender';
    
    const resendModule = await import('resend');
    const resendInstance = new resendModule.Resend();
    mockSend = resendInstance.emails.send;
    
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('sendConfirmationEmail', () => {
    const mockFormData = {
      agentEmail: 'agent@example.com',
      propertyType: 'apartment',
      address: '123 Rue de la Paix, Paris',
      price: '500000',
      targetBuyer: 'jeune_famille',
      roomCount: '4',
      livingArea: '100',
      constructionYear: '2020',
      keyPoints: 'Vue panoramique\nProche transports',
      propertyDescription: 'Bel appartement lumineux',
    };

    it('should send email successfully with all form data', async () => {
      mockSend.mockResolvedValue({ id: 'email_123' });

      const result = await sendConfirmationEmail(mockFormData, 3);

      expect(result).toEqual({
        success: true,
        data: { id: 'email_123' }
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const emailCall = mockSend.mock.calls[0][0];
      
      expect(emailCall.to).toBe('agent@example.com');
      expect(emailCall.subject).toBe('Confirmation de réception - Dossier immobilier');
      expect(emailCall.from).toBe('Test Sender <test@example.com>');
      expect(emailCall.html).toContain('123 Rue de la Paix, Paris');
      expect(emailCall.html).toContain('500');
      expect(emailCall.html).toContain('Appartement');
      expect(emailCall.html).toContain('3 photo');
      expect(emailCall.text).toContain('123 Rue de la Paix, Paris');
    });

    it('should send email successfully with only required fields', async () => {
      const minimalFormData = {
        agentEmail: 'agent@example.com',
        propertyType: 'house',
        address: '456 Avenue Victor Hugo',
        price: '750000',
        targetBuyer: 'professionnel',
      };

      mockSend.mockResolvedValue({ id: 'email_456' });

      const result = await sendConfirmationEmail(minimalFormData, 0);

      expect(result).toEqual({
        success: true,
        data: { id: 'email_456' }
      });

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('Maison');
      expect(emailCall.html).toContain('0 photo');
      expect(emailCall.html).not.toContain('Nombre de pièces');
      expect(emailCall.html).not.toContain('Surface habitable');
    });

    it('should handle email sending failure gracefully', async () => {
      mockSend.mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await sendConfirmationEmail(mockFormData, 2);

      expect(result).toEqual({
        success: false,
        error: 'API rate limit exceeded',
        details: new Error('API rate limit exceeded')
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error)
      );
    });

    it('should handle missing API key', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendConfirmationEmail(mockFormData, 1);

      expect(result).toEqual({
        success: false,
        error: 'RESEND_API_KEY is not configured',
        details: expect.any(Error)
      });
    });

    it('should use default sender when not configured', async () => {
      delete process.env.EMAIL_FROM_ADDRESS;
      delete process.env.EMAIL_FROM_NAME;

      mockSend.mockResolvedValue({ id: 'email_789' });

      await sendConfirmationEmail(mockFormData, 1);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.from).toBe('Générateur de Dossier Immobilier <onboarding@resend.dev>');
    });

    it('should format price correctly in email', async () => {
      mockSend.mockResolvedValue({ id: 'email_price' });

      await sendConfirmationEmail(mockFormData, 0);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toMatch(/500[\s\u00A0]?000[\s\u00A0]?€/);
      expect(emailCall.text).toMatch(/500[\s\u00A0]?000[\s\u00A0]?€/);
    });

    it('should handle line breaks in text fields', async () => {
      const dataWithLineBreaks = {
        ...mockFormData,
        keyPoints: 'Point 1\nPoint 2\nPoint 3',
        propertyDescription: 'Ligne 1\nLigne 2',
      };

      mockSend.mockResolvedValue({ id: 'email_breaks' });

      await sendConfirmationEmail(dataWithLineBreaks, 0);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('Point 1<br>Point 2<br>Point 3');
      expect(emailCall.html).toContain('Ligne 1<br>Ligne 2');
      expect(emailCall.text).toContain('Point 1\nPoint 2\nPoint 3');
    });

    it('should handle singular and plural photo count', async () => {
      mockSend.mockResolvedValue({ id: 'email_photos' });

      await sendConfirmationEmail(mockFormData, 1);
      let emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('1 photo');
      expect(emailCall.text).toContain('1 photo');

      await sendConfirmationEmail(mockFormData, 5);
      emailCall = mockSend.mock.calls[1][0];
      expect(emailCall.html).toContain('5 photos');
      expect(emailCall.text).toContain('5 photos');
    });
  });
});