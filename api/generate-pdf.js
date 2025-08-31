import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security: Maximum limits for resource protection
const MAX_PHOTOS = 20;
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PROPERTY_DATA_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

/**
 * HTML escape function to prevent XSS attacks
 */
function escapeHtml(text) {
  if (text == null) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate and sanitize logo data
 */
function validateLogoData(logoData) {
  if (!logoData) return null;
  
  // Check if it's a data URL
  if (typeof logoData === 'string' && logoData.startsWith('data:')) {
    const matches = logoData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid logo data format');
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Validate MIME type
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new Error(`Invalid image type: ${mimeType}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    }
    
    // Check size (rough estimate: base64 is ~1.37x larger than binary)
    const estimatedSize = (base64Data.length * 3) / 4;
    if (estimatedSize > MAX_LOGO_SIZE) {
      throw new Error(`Logo file too large. Maximum size: ${MAX_LOGO_SIZE / 1024 / 1024}MB`);
    }
    
    return logoData;
  }
  
  return null;
}

// Template presets configuration
const TEMPLATE_PRESETS = {
  modern: {
    colors: {
      primary: '#3498db',
      secondary: '#2c3e50',
      accent: '#667eea'
    },
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    style: 'clean'
  },
  classic: {
    colors: {
      primary: '#8B7355',
      secondary: '#2F4F4F',
      accent: '#DAA520'
    },
    fontFamily: "'Georgia', 'Times New Roman', serif",
    style: 'traditional'
  },
  luxury: {
    colors: {
      primary: '#FFD700',
      secondary: '#000000',
      accent: '#C9A961'
    },
    fontFamily: "'Playfair Display', 'Georgia', serif",
    style: 'elegant'
  },
  corporate: {
    colors: {
      primary: '#34495e',
      secondary: '#2c3e50',
      accent: '#3498db'
    },
    fontFamily: "'Roboto', 'Arial', sans-serif",
    style: 'professional'
  },
  eco: {
    colors: {
      primary: '#27ae60',
      secondary: '#2c3e50',
      accent: '#16a085'
    },
    fontFamily: "'Open Sans', 'Helvetica', sans-serif",
    style: 'sustainable'
  }
};

/**
 * Get browser instance for PDF generation
 */
async function getBrowser() {
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  
  if (!isVercel) {
    // Local development - use regular puppeteer
    try {
      return await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (e) {
      console.log('Falling back to puppeteer-core for local development');
      // Fall back to puppeteer-core if puppeteer is not available
      return await puppeteerCore.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  } else {
    // Vercel production - use puppeteer-core with chromium
    console.log('Running on Vercel, using @sparticuz/chromium');
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
}

/**
 * Apply template customizations to HTML
 */
function applyCustomizations(html, customizations) {
  const preset = TEMPLATE_PRESETS[customizations.template] || TEMPLATE_PRESETS.modern;
  const colors = { ...preset.colors, ...customizations.colors };
  
  // Inject CSS variables
  const cssVariables = `
    <style>
      :root {
        --primary-color: ${colors.primary};
        --secondary-color: ${colors.secondary};
        --accent-color: ${colors.accent};
        --font-family: ${preset.fontFamily};
        --photo-layout: ${customizations.layout?.photoStyle || 'grid'};
        --photo-columns: ${customizations.layout?.photoColumns || 2};
      }
      
      body {
        font-family: var(--font-family);
      }
      
      .property-title,
      .section-title,
      .feature-value {
        color: var(--secondary-color);
      }
      
      .section-title {
        border-bottom-color: var(--primary-color);
      }
      
      .ai-narrative {
        border-left-color: var(--primary-color);
      }
      
      .highlight-icon {
        background: var(--primary-color);
      }
      
      .agent-section {
        background: linear-gradient(135deg, var(--accent-color) 0%, var(--primary-color) 100%);
      }
      
      .social-post {
        border-left-color: var(--primary-color);
      }
      
      .social-platform {
        color: var(--primary-color);
      }
      
      ${customizations.layout?.photoStyle === 'list' ? `
        .photo-gallery {
          display: flex;
          flex-direction: column;
          gap: 10mm;
        }
        
        .photo-item {
          width: 100%;
          height: 100mm;
        }
        
        .photo-item.large {
          height: 100mm;
        }
      ` : ''}
      
      ${customizations.layout?.photoColumns ? `
        .photo-gallery {
          grid-template-columns: repeat(${customizations.layout.photoColumns}, 1fr);
        }
      ` : ''}
    </style>
  `;
  
  // Insert CSS variables after opening head tag
  html = html.replace('</head>', cssVariables + '</head>');
  
  // Handle logo if provided (already validated)
  if (customizations.logo) {
    // Logo is already validated and safe to use
    html = html.replace('{{agentLogo}}', customizations.logo);
  }
  
  // Handle section visibility
  if (customizations.layout?.showAgent === false) {
    html = html.replace(/<section class="agent-section">[\s\S]*?<\/section>/g, '');
  }
  if (customizations.layout?.showSocial === false) {
    html = html.replace(/<section class="social-section">[\s\S]*?<\/section>/g, '');
  }
  if (customizations.layout?.showAI === false) {
    html = html.replace(/<div class="ai-narrative">[\s\S]*?<\/div>/g, '');
  }
  
  return html;
}

/**
 * Generate HTML from template and data
 */
async function generateHtml(templateName, data, customizations) {
  try {
    // Load base template
    const templatePath = path.join(__dirname, 'templates', 'dossierTemplate.html');
    let html = await fs.readFile(templatePath, 'utf-8');
    
    // Apply customizations
    html = applyCustomizations(html, customizations);
    
    // Replace template variables
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (Array.isArray(value)) {
        if (key === 'photos') {
          // Limit number of photos to prevent resource exhaustion
          const limitedPhotos = value.slice(0, MAX_PHOTOS);
          const photosHtml = limitedPhotos.map((photo, index) => {
            // Escape photo URL to prevent injection
            const safePhoto = escapeHtml(photo);
            return `<img src="${safePhoto}" alt="Photo ${index + 1}" class="photo-item ${index === 0 ? 'large' : ''}">`;
          }).join('\n');
          html = html.replace(/{{#photos}}[\s\S]*?{{\/photos}}/g, photosHtml);
        } else if (key === 'highlights') {
          const highlightsHtml = value.map(highlight => {
            // Escape highlight text to prevent XSS
            const safeHighlight = escapeHtml(highlight);
            return `<div class="highlight-item">
              <div class="highlight-icon"></div>
              <span>${safeHighlight}</span>
            </div>`;
          }).join('\n');
          html = html.replace(/{{#highlights}}[\s\S]*?{{\/highlights}}/g, highlightsHtml);
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(subKey => {
          // Escape all object values to prevent XSS
          const safeValue = escapeHtml(value[subKey]);
          html = html.replace(new RegExp(`{{${key}\\.${subKey}}}`, 'g'), safeValue);
        });
      } else {
        // Escape all template values to prevent XSS
        const safeValue = escapeHtml(value);
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), safeValue);
      }
    });
    
    // Clean up remaining template syntax
    html = html.replace(/{{#if.*?}}[\s\S]*?{{\/if}}/g, '');
    html = html.replace(/{{.*?}}/g, '');
    
    return html;
  } catch (error) {
    console.error('Failed to generate HTML:', error);
    throw error;
  }
}

/**
 * Main handler for PDF generation endpoint
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Performance monitoring
  const startTime = Date.now();
  const performanceMetrics = {
    validationTime: 0,
    htmlGenerationTime: 0,
    browserLaunchTime: 0,
    pdfGenerationTime: 0,
    totalTime: 0
  };
  
  let browser = null;
  let page = null;
  
  try {
    // Parse request body
    const { propertyData, customizations = {}, aiContent = {} } = req.body;
    
    if (!propertyData) {
      return res.status(400).json({ error: 'Property data is required' });
    }
    
    // Security: Check request size to prevent resource exhaustion
    const requestSize = JSON.stringify(req.body).length;
    if (requestSize > MAX_PROPERTY_DATA_SIZE) {
      return res.status(413).json({ 
        error: 'Request too large',
        details: `Maximum request size: ${MAX_PROPERTY_DATA_SIZE / 1024 / 1024}MB`
      });
    }
    
    // Security: Validate photo count
    if (propertyData.photos && propertyData.photos.length > MAX_PHOTOS) {
      return res.status(400).json({ 
        error: 'Too many photos',
        details: `Maximum ${MAX_PHOTOS} photos allowed. You provided ${propertyData.photos.length}.`
      });
    }
    
    // Validate and sanitize logo if provided
    let validatedLogo = null;
    if (customizations.logo) {
      try {
        validatedLogo = validateLogoData(customizations.logo);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid logo data',
          details: error.message
        });
      }
    }
    
    performanceMetrics.validationTime = Date.now() - startTime;
    
    // Set default customizations with validated logo
    const finalCustomizations = {
      template: customizations.template || 'modern',
      colors: customizations.colors || {},
      logo: validatedLogo || '',
      layout: {
        photoStyle: customizations.layout?.photoStyle || 'grid',
        photoColumns: customizations.layout?.photoColumns || 2,
        showAgent: customizations.layout?.showAgent !== false,
        showSocial: customizations.layout?.showSocial !== false,
        showAI: customizations.layout?.showAI !== false
      }
    };
    
    // Integrate AI content from Story 2.1 if available
    if (aiContent && aiContent.narrative) {
      propertyData.aiNarrative = aiContent.narrative;
    }
    
    if (aiContent && aiContent.socialMedia) {
      propertyData.aiSocialContent = {
        instagram: aiContent.socialMedia.instagram,
        facebook: aiContent.socialMedia.facebook,
        linkedin: aiContent.socialMedia.linkedin
      };
    }
    
    // Add generation date if not provided
    if (!propertyData.generationDate) {
      propertyData.generationDate = new Date().toLocaleDateString('fr-CH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Map propertyData to template variables
    const templateData = {
      propertyType: propertyData.propertyType || 'Propriété',
      address: propertyData.address || '',
      price: formatPrice(propertyData.price),
      surface: propertyData.surface || propertyData.livingArea || '0',
      rooms: propertyData.rooms || propertyData.roomCount || '0',
      bedrooms: propertyData.bedrooms || propertyData.bedroomCount || '0',
      bathrooms: propertyData.bathrooms || propertyData.bathroomCount || '0',
      yearBuilt: propertyData.yearBuilt || propertyData.constructionYear || '',
      heatingType: propertyData.heatingType || '',
      energyClass: propertyData.energyClass || '',
      ghgClass: propertyData.ghgClass || '',
      highlights: propertyData.highlights || [],
      description: propertyData.description || '',
      photos: propertyData.photos || [],
      heroImage: propertyData.photos && propertyData.photos[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjQwMCIgeT0iMjAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjUwcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+UGhvdG8gbm9uIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+',
      agentName: propertyData.agentName || '',
      agentPhone: propertyData.agentPhone || '',
      agentEmail: propertyData.agentEmail || '',
      agencyName: propertyData.agencyName || '',
      generationDate: propertyData.generationDate,
      aiNarrative: propertyData.aiNarrative || 'Description à venir...',
      aiSocialContent: propertyData.aiSocialContent || {}
    };
    
    // Helper function to format price (Swiss format)
    const formatPrice = (price) => {
      if (!price) return 'Prix sur demande';
      const numPrice = parseInt(price);
      // Format with Swiss style: 665'000 CHF
      return numPrice.toLocaleString('fr-CH').replace(/,/g, "'") + ' CHF';
    };
    
    // Generate HTML with customizations
    const htmlStartTime = Date.now();
    const htmlContent = await generateHtml(
      finalCustomizations.template,
      templateData,
      finalCustomizations
    );
    performanceMetrics.htmlGenerationTime = Date.now() - htmlStartTime;
    
    // Initialize browser
    const browserStartTime = Date.now();
    browser = await getBrowser();
    page = await browser.newPage();
    performanceMetrics.browserLaunchTime = Date.now() - browserStartTime;
    
    // Set content and wait for resources
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 25000 // 25s timeout (leaving 5s buffer for Vercel)
    });
    
    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate PDF
    const pdfStartTime = Date.now();
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
    performanceMetrics.pdfGenerationTime = Date.now() - pdfStartTime;
    performanceMetrics.totalTime = Date.now() - startTime;
    
    // Log performance metrics for monitoring
    console.log('PDF Generation Performance:', {
      ...performanceMetrics,
      template: finalCustomizations.template,
      photoCount: propertyData.photos?.length || 0,
      hasLogo: !!finalCustomizations.logo,
      hasAI: !!propertyData.aiNarrative
    });
    
    // Log the type of pdfBuffer for debugging
    console.log('PDF Buffer type:', typeof pdfBuffer, 'Is Buffer:', Buffer.isBuffer(pdfBuffer));
    
    // Convert PDF to base64 for proper transmission
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    // Send as JSON with base64 encoded PDF
    res.status(200).json({
      success: true,
      pdf: pdfBase64,
      performance: performanceMetrics,
      filename: `dossier-${Date.now()}.pdf`
    });
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Determine error type and send appropriate response
    if (error.message?.includes('timeout')) {
      return res.status(504).json({ 
        error: 'PDF generation timed out',
        details: 'The PDF generation took too long. Please try again with smaller images.'
      });
    }
    
    return res.status(500).json({ 
      error: 'PDF generation failed',
      details: error.message
    });
    
  } finally {
    // Clean up resources
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// Export configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Allow larger payloads for images
    }
  }
};