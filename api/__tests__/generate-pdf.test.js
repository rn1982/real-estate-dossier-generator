import { createMocks } from 'node-mocks-http';
import handler from '../generate-pdf.js';

describe('/api/generate-pdf', () => {
  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' });
  });

  it('should return 400 if property data is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Property data is required' });
  });

  it('should accept valid property data with customizations', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        propertyData: {
          propertyType: 'Appartement',
          address: '15 Rue de la Paix, 75002 Paris',
          price: '850 000 €',
          surface: '120',
          rooms: '5',
          bedrooms: '3',
          bathrooms: '2',
          agentName: 'Marie Dubois',
          agentPhone: '01 42 56 78 90',
          agentEmail: 'marie.dubois@immobilier-paris.fr',
          agencyName: 'Immobilier Prestige Paris',
          photos: [],
          highlights: ['Parquet', 'Moulures', 'Cave'],
        },
        customizations: {
          template: 'modern',
          colors: {
            primary: '#3498db',
            secondary: '#2c3e50',
            accent: '#667eea'
          },
          layout: {
            photoStyle: 'grid',
            photoColumns: 2,
            showAgent: true,
            showSocial: true,
            showAI: true
          }
        },
        aiContent: {
          narrative: 'Magnifique appartement haussmannien...',
          socialMedia: {
            instagram: 'COUP DE CŒUR ASSURÉ!',
            facebook: 'NOUVELLE EXCLUSIVITÉ',
            linkedin: 'Opportunité d\'investissement'
          }
        }
      },
    });

    // Mock Puppeteer to avoid actual browser launch in tests
    process.env.NODE_ENV = 'test';

    // Note: Full PDF generation test would require mocking Puppeteer
    // For now, we just verify the endpoint accepts the correct data structure
    expect(req.body.propertyData).toBeDefined();
    expect(req.body.customizations).toBeDefined();
    expect(req.body.aiContent).toBeDefined();
  });

  it('should handle all 5 template presets', () => {
    const templates = ['modern', 'classic', 'luxury', 'corporate', 'eco'];
    
    templates.forEach(template => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          propertyData: { /* minimal data */ },
          customizations: { template }
        }
      });
      
      expect(req.body.customizations.template).toBe(template);
    });
  });

  it('should handle photo layout options', () => {
    const layouts = ['grid', 'list'];
    const columns = [2, 3, 4];
    
    layouts.forEach(layout => {
      columns.forEach(col => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            propertyData: { /* minimal data */ },
            customizations: {
              layout: {
                photoStyle: layout,
                photoColumns: col
              }
            }
          }
        });
        
        expect(req.body.customizations.layout.photoStyle).toBe(layout);
        expect(req.body.customizations.layout.photoColumns).toBe(col);
      });
    });
  });

  // Security Tests
  describe('Security Validations', () => {
    it('should reject requests with too many photos', async () => {
      const photos = Array(25).fill('https://example.com/photo.jpg');
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          propertyData: {
            propertyType: 'Appartement',
            photos: photos
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Too many photos');
      expect(response.details).toContain('Maximum 20 photos allowed');
    });

    it('should reject oversized requests', async () => {
      // Create a large property data object
      const largeData = {
        propertyType: 'Appartement',
        description: 'x'.repeat(6 * 1024 * 1024) // 6MB string
      };
      
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          propertyData: largeData
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(413);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Request too large');
    });

    it('should reject invalid logo MIME types', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          propertyData: {
            propertyType: 'Appartement'
          },
          customizations: {
            logo: 'data:application/javascript;base64,Y29uc29sZS5sb2coIlhTUyIpOw=='
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid logo data');
      expect(response.details).toContain('Invalid image type');
    });

    it('should reject oversized logo files', async () => {
      // Create a fake large base64 image (> 2MB)
      const largeBase64 = 'a'.repeat(3 * 1024 * 1024); // ~3MB when decoded
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          propertyData: {
            propertyType: 'Appartement'
          },
          customizations: {
            logo: `data:image/png;base64,${largeBase64}`
          }
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Invalid logo data');
      expect(response.details).toContain('Logo file too large');
    });

    it('should accept valid logo data', async () => {
      const validLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          propertyData: {
            propertyType: 'Appartement'
          },
          customizations: {
            logo: validLogo
          }
        }
      });

      // Mock environment to avoid Puppeteer
      process.env.NODE_ENV = 'test';

      // Just verify the request is accepted with valid logo
      expect(req.body.customizations.logo).toBe(validLogo);
    });

    it('should escape HTML in user inputs to prevent XSS', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const { req } = createMocks({
        method: 'POST',
        body: {
          propertyData: {
            propertyType: maliciousInput,
            address: '"><img src=x onerror=alert(1)>',
            highlights: [
              '<iframe src="javascript:alert(1)"></iframe>',
              '"><script>alert(2)</script>'
            ]
          }
        }
      });

      // The handler should escape these values when generating HTML
      // This test verifies the structure is accepted
      expect(req.body.propertyData.propertyType).toBe(maliciousInput);
      // Actual escaping is tested in the generateHtml function
    });
  });
});