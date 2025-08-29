import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Puppeteer PDF Generation PoC - Local Test Version
 */
export class PuppeteerPdfGeneratorLocal {
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

  async init() {
    try {
      this.metrics.startTime = Date.now();
      
      // Simple local configuration
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('✅ Puppeteer browser initialized (local version)');
    } catch (error) {
      console.error('❌ Failed to initialize Puppeteer:', error);
      throw error;
    }
  }

  async generateHtml(templatePath, data) {
    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      let html = template;
      
      // Simple template replacement
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          if (key === 'photos') {
            const photosHtml = value.map((photo, index) => 
              `<img src="${photo}" alt="Photo ${index + 1}" class="photo-item ${index === 0 ? 'large' : ''}">`
            ).join('\n');
            html = html.replace(/{{#photos}}[\s\S]*?{{\/photos}}/g, photosHtml);
          } else if (key === 'highlights') {
            const highlightsHtml = value.map(highlight => 
              `<div class="highlight-item">
                <div class="highlight-icon"></div>
                <span>${highlight}</span>
              </div>`
            ).join('\n');
            html = html.replace(/{{#highlights}}[\s\S]*?{{\/highlights}}/g, highlightsHtml);
          }
        } else if (typeof value === 'object' && value !== null) {
          Object.keys(value).forEach(subKey => {
            html = html.replace(new RegExp(`{{${key}\\.${subKey}}}`, 'g'), value[subKey] || '');
          });
        } else {
          html = html.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        }
      });
      
      // Clean up remaining template syntax
      html = html.replace(/{{#if.*?}}[\s\S]*?{{\/if}}/g, '');
      html = html.replace(/{{.*?}}/g, '');
      
      return html;
    } catch (error) {
      console.error('❌ Failed to generate HTML:', error);
      throw error;
    }
  }

  async generatePdf(htmlContent, outputPath) {
    let page = null;
    try {
      const memBefore = process.memoryUsage();
      
      page = await this.browser.newPage();
      
      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait a bit for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
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
      this.metrics.fileSize = Math.round(stats.size / 1024);
      
      console.log('✅ PDF generated successfully:', outputPath);
      console.log('📊 Generation metrics:', this.metrics);
      
      return {
        success: true,
        path: outputPath,
        metrics: this.metrics
      };
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Puppeteer browser closed');
    }
  }
}

function getSampleData() {
  return {
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
    
    heroImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=800',
      'https://images.unsplash.com/photo-1558442086-1f2f3d6b4e8a?w=800',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
    ],
    
    aiNarrative: `Découvrez ce magnifique appartement haussmannien de 120m² idéalement situé au cœur du 2ème arrondissement de Paris. 
    Ce bien d'exception offre des volumes généreux avec ses 3,5 mètres de hauteur sous plafond, ses moulures d'origine et son parquet en point de Hongrie parfaitement conservé. 
    La luminosité exceptionnelle de cet appartement traversant est sublimée par ses grandes fenêtres donnant sur une rue calme.`,
    
    highlights: [
      'Parquet point de Hongrie',
      'Moulures et cheminées d\'époque',
      'Hauteur sous plafond 3,5m',
      'Appartement traversant',
      'Cave et local vélos',
      'Proche métro ligne 3 et 9'
    ],
    
    aiSocialContent: {
      instagram: "🏠 COUP DE CŒUR ASSURÉ ! Sublime appartement haussmannien en plein cœur de Paris ✨",
      facebook: "🔑 NOUVELLE EXCLUSIVITÉ - Paris 2ème arrondissement"
    },
    
    agentName: 'Marie Dubois',
    agentPhone: '01 42 56 78 90',
    agentEmail: 'marie.dubois@immobilier-paris.fr',
    agencyName: 'Immobilier Prestige Paris',
    agentLogo: '',
    
    generationDate: new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  };
}

export async function testPuppeteerPocLocal() {
  const generator = new PuppeteerPdfGeneratorLocal();
  
  try {
    console.log('🚀 Starting Puppeteer PoC test (local version)...');
    
    await generator.init();
    
    const propertyData = getSampleData();
    const templatePath = path.join(__dirname, '../templates/dossierTemplate.html');
    const htmlContent = await generator.generateHtml(templatePath, propertyData);
    
    const outputDir = path.join(__dirname, '../../generated-pdfs');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `puppeteer-poc-${Date.now()}.pdf`);
    const result = await generator.generatePdf(htmlContent, outputPath);
    
    console.log('✅ Puppeteer PoC test completed successfully');
    console.log('📄 PDF saved to:', outputPath);
    console.log('📊 Performance Metrics:');
    console.log(`   - Generation time: ${result.metrics.generationTime}ms`);
    console.log(`   - Memory usage: ${result.metrics.memoryUsage.diff}MB`);
    console.log(`   - File size: ${result.metrics.fileSize}KB`);
    
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
  testPuppeteerPocLocal().catch(console.error);
}