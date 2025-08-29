import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Puppeteer PDF Generation PoC
 * Uses @sparticuz/chromium for Vercel compatibility
 */
export class PuppeteerPdfGenerator {
  constructor() {
    this.browser = null;
    this.metrics = {
      startTime: null,
      endTime: null,
      generationTime: null,
      memoryUsage: null,
      fileSize: null
    };
  }

  /**
   * Initialize the browser instance
   */
  async init() {
    try {
      this.metrics.startTime = Date.now();
      
      // Configure for serverless environment
      const options = {
        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: 'new',
        ignoreHTTPSErrors: true,
      };

      this.browser = await puppeteer.launch(options);
      console.log('Puppeteer browser initialized');
    } catch (error) {
      console.error('Failed to initialize Puppeteer:', error);
      throw error;
    }
  }

  /**
   * Generate HTML from template and data
   */
  async generateHtml(templatePath, data) {
    try {
      // Read template
      const template = await fs.readFile(templatePath, 'utf-8');
      
      // Simple template replacement (in production, use a proper template engine like Handlebars)
      let html = template;
      
      // Replace all template variables
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          // Handle arrays (like photos, highlights)
          if (key === 'photos') {
            const photosHtml = value.map((photo, index) => 
              `<img src="${photo}" alt="Photo ${index + 1}" class="photo-item ${index === 0 ? 'large' : ''}">`
            ).join('\n');
            html = html.replace(`{{#${key}}}{{.}}{{/${key}}}`, photosHtml);
          } else if (key === 'highlights') {
            const highlightsHtml = value.map(highlight => 
              `<div class="highlight-item">
                <div class="highlight-icon"></div>
                <span>${highlight}</span>
              </div>`
            ).join('\n');
            html = html.replace(`{{#${key}}}{{.}}{{/${key}}}`, highlightsHtml);
          }
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects (like aiSocialContent)
          Object.keys(value).forEach(subKey => {
            html = html.replace(new RegExp(`{{${key}\\.${subKey}}}`, 'g'), value[subKey] || '');
          });
        } else {
          // Handle simple values
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }
      });
      
      // Remove any remaining template syntax for optional fields
      html = html.replace(/{{#if.*?}}[\s\S]*?{{\/if}}/g, '');
      html = html.replace(/{{.*?}}/g, '');
      
      return html;
    } catch (error) {
      console.error('Failed to generate HTML:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePdf(htmlContent, outputPath) {
    let page = null;
    try {
      // Record memory before generation
      const memBefore = process.memoryUsage();
      
      // Create new page
      page = await this.browser.newPage();
      
      // Set content with proper encoding for French characters
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Generate PDF with A4 format
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        preferCSSPageSize: true
      });
      
      // Save PDF
      await fs.writeFile(outputPath, pdfBuffer);
      
      // Record metrics
      const memAfter = process.memoryUsage();
      this.metrics.endTime = Date.now();
      this.metrics.generationTime = this.metrics.endTime - this.metrics.startTime;
      this.metrics.memoryUsage = {
        before: Math.round(memBefore.heapUsed / 1024 / 1024),
        after: Math.round(memAfter.heapUsed / 1024 / 1024),
        diff: Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024)
      };
      
      const stats = await fs.stat(outputPath);
      this.metrics.fileSize = Math.round(stats.size / 1024); // KB
      
      console.log('PDF generated successfully:', outputPath);
      console.log('Generation metrics:', this.metrics);
      
      return {
        success: true,
        path: outputPath,
        metrics: this.metrics
      };
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Clean up browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Puppeteer browser closed');
    }
  }
}

/**
 * Main handler for Vercel serverless function
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const generator = new PuppeteerPdfGenerator();
  
  try {
    // Initialize browser
    await generator.init();
    
    // Get property data from request
    const propertyData = req.body || getSampleData();
    
    // Generate HTML from template
    const templatePath = path.join(__dirname, '../templates/dossierTemplate.html');
    const htmlContent = await generator.generateHtml(templatePath, propertyData);
    
    // Generate PDF
    const outputPath = `/tmp/dossier-${Date.now()}.pdf`;
    const result = await generator.generatePdf(htmlContent, outputPath);
    
    // Read PDF file
    const pdfBuffer = await fs.readFile(outputPath);
    
    // Clean up temp file
    await fs.unlink(outputPath);
    
    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dossier-immobilier.pdf"`);
    res.setHeader('X-Generation-Time', result.metrics.generationTime);
    res.setHeader('X-File-Size', result.metrics.fileSize);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  } finally {
    await generator.close();
  }
}

/**
 * Get sample property data for testing
 */
function getSampleData() {
  return {
    // Basic property info
    propertyType: 'Appartement',
    address: '15 Rue de la Paix, 75002 Paris',
    price: '850 000 €',
    surface: '120',
    rooms: '5',
    bedrooms: '3',
    bathrooms: '2',
    floor: '3ème étage',
    yearBuilt: '1890',
    heating: 'Chauffage central collectif',
    energyClass: 'C',
    monthlyCharges: '450 €',
    propertyTax: '2 800 €',
    
    // Images
    heroImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800',
      'https://images.unsplash.com/photo-1558442086-1f2f3d6b4e8a?w=800',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
    ],
    
    // AI generated content
    aiNarrative: `Découvrez ce magnifique appartement haussmannien de 120m² idéalement situé au cœur du 2ème arrondissement de Paris. 
    Ce bien d'exception offre des volumes généreux avec ses 3,5 mètres de hauteur sous plafond, ses moulures d'origine et son parquet en point de Hongrie parfaitement conservé. 
    La luminosité exceptionnelle de cet appartement traversant est sublimée par ses grandes fenêtres donnant sur une rue calme. 
    L'agencement optimal comprend un vaste séjour de 45m², une cuisine équipée moderne, trois chambres spacieuses dont une suite parentale avec salle de bains attenante. 
    Proche de toutes commodités, métro et commerces, ce bien rare sur le marché constitue une opportunité unique pour une famille recherchant le charme de l'ancien avec le confort du moderne.`,
    
    highlights: [
      'Parquet point de Hongrie',
      'Moulures et cheminées d\'époque',
      'Hauteur sous plafond 3,5m',
      'Appartement traversant',
      'Cave et local vélos',
      'Proche métro ligne 3 et 9'
    ],
    
    aiSocialContent: {
      instagram: "🏠 COUP DE CŒUR ASSURÉ ! Sublime appartement haussmannien en plein cœur de Paris ✨ 120m² de pur charme avec parquet ancien, moulures et hauteur sous plafond exceptionnelle. Une perle rare à découvrir absolument ! 📍 Paris 2ème #immobilierparis #appartementparis #haussmannien",
      facebook: "🔑 NOUVELLE EXCLUSIVITÉ - Paris 2ème arrondissement\n\nNous sommes ravis de vous présenter ce magnifique appartement de 120m² qui allie parfaitement le charme de l'ancien et le confort moderne. Situé dans un immeuble haussmannien de standing, ce bien d'exception saura séduire les amateurs d'authenticité.\n\n✅ 5 pièces - 3 chambres\n✅ Parquet point de Hongrie et moulures d'origine\n✅ Luminosité exceptionnelle\n✅ Proche de toutes commodités\n\nContactez-nous vite pour organiser une visite !"
    },
    
    // Agent info
    agentName: 'Marie Dubois',
    agentPhone: '01 42 56 78 90',
    agentEmail: 'marie.dubois@immobilier-paris.fr',
    agencyName: 'Immobilier Prestige Paris',
    agentLogo: 'https://via.placeholder.com/150x50/667eea/ffffff?text=LOGO',
    
    // Metadata
    generationDate: new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };
}

/**
 * CLI test function
 */
export async function testPuppeteerPoc() {
  const generator = new PuppeteerPdfGenerator();
  
  try {
    console.log('Starting Puppeteer PoC test...');
    
    // Initialize
    await generator.init();
    
    // Generate with sample data
    const propertyData = getSampleData();
    const templatePath = path.join(__dirname, '../templates/dossierTemplate.html');
    const htmlContent = await generator.generateHtml(templatePath, propertyData);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../generated-pdfs');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate PDF
    const outputPath = path.join(outputDir, `puppeteer-poc-${Date.now()}.pdf`);
    const result = await generator.generatePdf(htmlContent, outputPath);
    
    console.log('✅ Puppeteer PoC test completed successfully');
    console.log('📄 PDF saved to:', outputPath);
    console.log('📊 Metrics:', result.metrics);
    
    return result;
  } catch (error) {
    console.error('❌ Puppeteer PoC test failed:', error);
    throw error;
  } finally {
    await generator.close();
  }
}

// Run test if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  testPuppeteerPoc().catch(console.error);
}