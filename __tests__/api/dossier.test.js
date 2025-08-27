import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../api/dossier';
import formidable from 'formidable';

// Mock formidable
vi.mock('formidable');

describe('/api/dossier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALLOWED_ORIGIN = 'http://localhost:5173';
  });

  afterEach(() => {
    delete process.env.ALLOWED_ORIGIN;
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS request for CORS preflight', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res._getHeaders()['access-control-allow-methods']).toBe('POST, OPTIONS');
      expect(res._getHeaders()['access-control-allow-headers']).toBe('Content-Type');
      expect(res._getHeaders()['access-control-max-age']).toBe('86400');
    });

    it('should validate CORS origin from environment', async () => {
      process.env.ALLOWED_ORIGIN = 'https://production.com';
      const { req, res } = createMocks({
        method: 'OPTIONS',
      });

      await handler(req, res);

      expect(res._getHeaders()['access-control-allow-origin']).toBe('https://production.com');
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
    });
  });

  describe('Form data processing', () => {
    it('should successfully process valid form data', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        propertyType: ['appartement'],
        address: ['123 Rue Example'],
        price: ['500000'],
        targetBuyer: ['jeune_famille'],
        roomCount: ['3.5'],
        livingArea: ['85'],
        constructionYear: ['2000'],
        keyPoints: ['Vue sur le lac'],
        propertyDescription: ['Belle propriété'],
      };

      const mockFiles = {
        photos: [
          {
            originalFilename: 'photo1.jpg',
            size: 1024,
            mimetype: 'image/jpeg',
          },
          {
            originalFilename: 'photo2.png',
            size: 2048,
            mimetype: 'image/png',
          },
        ],
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, mockFiles]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe('Dossier successfully received');
      expect(responseData.data.agentEmail).toBe('agent@example.com');
      expect(responseData.data.photoCount).toBe(2);
    });

    it('should handle missing required fields', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        // Missing other required fields
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, {}]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Missing required fields');
      expect(responseData.missingFields).toContain('propertyType');
      expect(responseData.missingFields).toContain('address');
      expect(responseData.missingFields).toContain('price');
      expect(responseData.missingFields).toContain('targetBuyer');
    });

    it('should validate property type enum', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        propertyType: ['invalid_type'],
        address: ['123 Rue Example'],
        price: ['500000'],
        targetBuyer: ['jeune_famille'],
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, {}]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Invalid property type');
      expect(responseData.validTypes).toEqual(['appartement', 'maison']);
    });

    it('should validate target buyer enum', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        propertyType: ['appartement'],
        address: ['123 Rue Example'],
        price: ['500000'],
        targetBuyer: ['invalid_buyer'],
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, {}]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Invalid target buyer');
      expect(responseData.validTypes).toContain('jeune_famille');
      expect(responseData.validTypes).toContain('professionnel');
    });
  });

  describe('File upload validation', () => {
    it('should reject invalid file types', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        propertyType: ['appartement'],
        address: ['123 Rue Example'],
        price: ['500000'],
        targetBuyer: ['jeune_famille'],
      };

      const mockFiles = {
        photos: {
          originalFilename: 'document.pdf',
          size: 1024,
          mimetype: 'application/pdf',
        },
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, mockFiles]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(415);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Unsupported media type');
      expect(responseData.file).toBe('document.pdf');
      expect(responseData.allowedTypes).toContain('image/jpeg');
    });

    it('should handle file size limit errors', async () => {
      const error = new Error('File too large');
      error.code = 'LIMIT_FILE_SIZE';
      
      const mockParse = vi.fn().mockRejectedValue(error);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(413);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('File size exceeds maximum allowed (10MB)');
    });

    it('should handle file count limit errors', async () => {
      const error = new Error('Too many files');
      error.code = 'LIMIT_FILE_COUNT';
      
      const mockParse = vi.fn().mockRejectedValue(error);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(413);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Too many files. Maximum 20 files allowed.');
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected file field errors', async () => {
      const error = new Error('Unexpected field');
      error.code = 'LIMIT_UNEXPECTED_FILE';
      
      const mockParse = vi.fn().mockRejectedValue(error);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Unexpected file field');
    });

    it('should handle generic server errors', async () => {
      const error = new Error('Database connection failed');
      
      const mockParse = vi.fn().mockRejectedValue(error);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Form data with optional fields', () => {
    it('should handle form submission without optional fields', async () => {
      const mockFields = {
        agentEmail: ['agent@example.com'],
        propertyType: ['appartement'],
        address: ['123 Rue Example'],
        price: ['500000'],
        targetBuyer: ['jeune_famille'],
      };

      const mockParse = vi.fn().mockResolvedValue([mockFields, {}]);
      vi.mocked(formidable).mockReturnValue({ parse: mockParse });

      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const responseData = JSON.parse(res._getData());
      expect(responseData.data.roomCount).toBeNull();
      expect(responseData.data.livingArea).toBeNull();
      expect(responseData.data.constructionYear).toBeNull();
      expect(responseData.data.keyPoints).toBeNull();
      expect(responseData.data.propertyDescription).toBeNull();
      expect(responseData.data.photoCount).toBe(0);
    });
  });
});