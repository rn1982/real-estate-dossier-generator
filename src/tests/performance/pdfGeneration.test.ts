import { describe, it, expect, beforeAll } from 'vitest';
import { generatePDF } from '@/services/pdfService';
import type { DossierFormData } from '@/types/dossierForm';

describe('PDF Generation Performance', () => {
  let testFormData: DossierFormData;
  
  beforeAll(() => {
    // Create test data with typical property information
    testFormData = {
      propertyType: 'house',
      address: 'Chemin du Test 123',
      city: 'Lausanne',
      postalCode: '1000',
      canton: 'VD',
      price: 1500000,
      livingArea: 250,
      landArea: 800,
      roomCount: 6.5,
      bedrooms: 4,
      bathrooms: 3,
      constructionYear: 2020,
      energyRating: 'A',
      propertyDescription: 'Beautiful modern house with lake view',
      keyPoints: 'Lake view, Modern, Garden',
      targetBuyer: 'family',
      agentName: 'Test Agent',
      agentPhone: '+41 12 345 67 89',
      agentEmail: 'agent@test.com',
      agencyName: 'Test Agency',
      photos: [],
      pdfTemplate: 'modern',
      pdfPrimaryColor: '#3B82F6',
      pdfSecondaryColor: '#10B981',
      pdfAccentColor: '#F59E0B',
      pdfPhotoLayout: 'grid',
      pdfPhotoColumns: 2,
      pdfShowAgent: true,
      pdfShowSocial: true,
      pdfShowAI: true,
      aiContent: {
        sellingPoints: ['Great location', 'Modern design', 'Energy efficient'],
        investmentAdvice: 'Excellent investment opportunity',
        neighborhoodInsights: 'Quiet residential area',
      },
    };
  });

  describe('Generation Speed Tests', () => {
    it('should generate PDF without photos in less than 3 seconds', async () => {
      const startTime = performance.now();
      
      await generatePDF(testFormData, 'download', () => {});
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(3000);
      console.log(`PDF generation without photos took ${duration.toFixed(2)}ms`);
    });

    it('should generate PDF with 5 photos in less than 3 seconds', async () => {
      // Create mock photo files
      const photos = Array.from({ length: 5 }, (_, i) => 
        new File([`photo${i}`], `photo${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const formDataWithPhotos = {
        ...testFormData,
        photos,
      };
      
      const startTime = performance.now();
      
      await generatePDF(formDataWithPhotos, 'download', () => {});
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(3000);
      console.log(`PDF generation with 5 photos took ${duration.toFixed(2)}ms`);
    });

    it('should generate PDF with 10 photos in less than 5 seconds', async () => {
      // Create mock photo files
      const photos = Array.from({ length: 10 }, (_, i) => 
        new File([`photo${i}`], `photo${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const formDataWithPhotos = {
        ...testFormData,
        photos,
      };
      
      const startTime = performance.now();
      
      await generatePDF(formDataWithPhotos, 'download', () => {});
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000);
      console.log(`PDF generation with 10 photos took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Template Performance Comparison', () => {
    const templates: Array<'modern' | 'classic' | 'luxury'> = ['modern', 'classic', 'luxury'];
    
    templates.forEach(template => {
      it(`should generate ${template} template in less than 3 seconds`, async () => {
        const formDataWithTemplate = {
          ...testFormData,
          pdfTemplate: template,
        };
        
        const startTime = performance.now();
        
        await generatePDF(formDataWithTemplate, 'download', () => {});
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(3000);
        console.log(`${template} template generation took ${duration.toFixed(2)}ms`);
      });
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory when generating multiple PDFs', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Generate 5 PDFs in sequence
      for (let i = 0; i < 5; i++) {
        await generatePDF(testFormData, 'download', () => {});
      }
      
      // Force garbage collection if available (requires --expose-gc flag)
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase after 5 PDF generations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('File Size Tests', () => {
    it('should generate PDF under 3MB with 10 photos', async () => {
      // Create mock photo files with realistic size
      const photos = Array.from({ length: 10 }, (_, i) => {
        const blob = new Blob([new ArrayBuffer(500 * 1024)], { type: 'image/jpeg' });
        return new File([blob], `photo${i}.jpg`, { type: 'image/jpeg' });
      });
      
      const formDataWithPhotos = {
        ...testFormData,
        photos,
      };
      
      const blob = await generatePDF(formDataWithPhotos, 'download', () => {});
      
      const sizeInMB = blob.size / (1024 * 1024);
      expect(sizeInMB).toBeLessThan(3);
      console.log(`PDF with 10 photos size: ${sizeInMB.toFixed(2)}MB`);
    });
  });
});