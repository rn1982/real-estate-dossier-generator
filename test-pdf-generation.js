import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfGeneration() {
  console.log('🚀 Testing PDF generation...');
  
  const testData = {
    propertyData: {
      title: 'Appartement de Luxe',
      address: '15 Rue de la Paix, 75002 Paris',
      price: '850,000 €',
      targetBuyer: 'jeune_famille',
      features: {
        rooms: '5',
        bedrooms: '3',
        bathrooms: '2',
        livingArea: '120',
        landArea: '0',
        yearBuilt: '1890',
        heatingType: 'Chauffage central',
        energyClass: 'C',
        ghgClass: 'D'
      },
      amenities: {
        garage: true,
        garden: false,
        pool: false,
        balcony: true
      },
      highlights: [
        'Parquet point de Hongrie',
        'Moulures d\'époque',
        'Hauteur sous plafond 3.5m',
        'Appartement traversant'
      ],
      description: 'Magnifique appartement haussmannien avec cachet de l\'ancien',
      generationDate: new Date().toLocaleDateString('fr-FR'),
      agent: {
        name: 'Jean Dupont',
        email: 'jean.dupont@immobilier.fr',
        phone: '01 23 45 67 89',
        company: 'Immobilier Paris'
      },
      photos: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800'
      ],
      aiNarrative: 'Un appartement exceptionnel au cœur de Paris...',
      aiSocialContent: {
        instagram: 'Coup de cœur assuré! 🏠',
        facebook: 'Nouvelle exclusivité à Paris',
        linkedin: 'Opportunité d\'investissement'
      }
    },
    customizations: {
      template: 'modern',
      colors: {},
      layout: {
        photoStyle: 'grid',
        photoColumns: 2,
        showAgent: true,
        showSocial: true,
        showAI: true
      }
    }
  };

  try {
    // Test local API
    const response = await fetch('http://localhost:3000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PDF generation failed:', response.status, errorText);
      return;
    }

    // Get PDF buffer
    const pdfBuffer = await response.arrayBuffer();
    
    // Save to file
    const outputDir = path.join(__dirname, 'generated-pdfs');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `test-pdf-${Date.now()}.pdf`);
    await fs.writeFile(outputPath, Buffer.from(pdfBuffer));
    
    console.log('✅ PDF generated successfully!');
    console.log('📄 Saved to:', outputPath);
    console.log('📊 File size:', Math.round(pdfBuffer.byteLength / 1024), 'KB');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testPdfGeneration().catch(console.error);