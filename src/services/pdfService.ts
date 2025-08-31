export class PDFServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PDFServiceError';
  }
}

interface PDFFormData {
  propertyType?: string;
  address?: string;
  price?: string;
  livingArea?: string | number;
  roomCount?: string | number;
  bedrooms?: string | number;
  bathrooms?: string | number;
  constructionYear?: string | number;
  propertyDescription?: string;
  keyPoints?: string;
  photos?: File[];  // Changed from photoUrls to match form data
  photoUrls?: string[];  // Keep for backward compatibility
  agentName?: string;
  agentPhone?: string;
  agentEmail: string;
  agencyName?: string;
  pdfTemplate?: string;
  pdfColorPrimary?: string;
  pdfColorSecondary?: string;
  pdfColorAccent?: string;
  pdfLogo?: string | File;
  pdfPhotoLayout?: string;
  pdfPhotoColumns?: number;
  pdfShowAgent?: boolean;
  pdfShowSocial?: boolean;
  pdfShowAI?: boolean;
  aiContent?: Record<string, unknown>;
  [key: string]: unknown;
}

// Helper function to convert and optimize File to base64 data URL
const fileToDataURL = (file: File, maxWidth: number = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (0.8 quality for JPEG)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to convert logo to base64 if it's a File
const processLogo = async (logo: string | File | undefined): Promise<string> => {
  if (!logo) return '';
  if (typeof logo === 'string') return logo;
  return await fileToDataURL(logo);
};

export const generatePDF = async (
  formData: PDFFormData, 
  useServerSide: boolean = false,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  // Convert photos from File[] to base64 data URLs (before try block for access in catch)
  let photoDataUrls: string[] = [];
  if (formData.photos && formData.photos.length > 0) {
    photoDataUrls = await Promise.all(
      formData.photos.map(photo => fileToDataURL(photo))
    );
  } else if (formData.photoUrls) {
    photoDataUrls = formData.photoUrls;
  }

  // Convert logo to base64 if it's a File
  const logoDataUrl = await processLogo(formData.pdfLogo);
  
  // Use React-PDF for direct downloads (client-side)
  if (!useServerSide) {
    try {
      const { generateAndDownloadPDF } = await import('./reactPdfService');
      
      // Convert PDFFormData to the format expected by React-PDF service
      const reactPdfFormData = {
        propertyTitle: formData.propertyType || 'Propriété',
        propertyType: formData.propertyType || '',
        address: formData.address || '',
        city: formData.address?.split(',')[1]?.trim() || '',
        postalCode: formData.address?.match(/\d{4}/)?.[0] || '',
        canton: 'Genève', // Default canton
        price: formData.price || '',
        rooms: String(formData.roomCount || ''),
        bedrooms: String(formData.bedrooms || ''),
        bathrooms: String(formData.bathrooms || ''),
        livingSpace: String(formData.livingArea || ''),
        yearBuilt: String(formData.constructionYear || ''),
        description: formData.propertyDescription || '',
        features: formData.keyPoints ? formData.keyPoints.split(',').map((f: string) => f.trim()) : [],
        photos: formData.photos || [],
        aiContent: formData.aiContent,
        agentName: formData.agentName,
        agentEmail: formData.agentEmail,
        agentPhone: formData.agentPhone,
        agencyName: formData.agencyName,
      };
      
      const template = (formData.pdfTemplate || 'modern') as 'modern' | 'classic' | 'luxury';
      
      const customization = {
        colors: {
          primary: formData.pdfColorPrimary || '#3B82F6',
          secondary: formData.pdfColorSecondary || '#10B981',
          accent: formData.pdfColorAccent || '#F59E0B',
          text: '#1F2937',
          background: '#FFFFFF',
        },
        logo: logoDataUrl,
        layout: {
          photoLayout: (formData.pdfPhotoLayout || 'grid') as 'grid' | 'list' | 'carousel',
          columns: (formData.pdfPhotoColumns || 2) as 1 | 2 | 3,
          showMap: false,
          showAmenities: formData.pdfShowAI !== false,
        },
      };
      
      await generateAndDownloadPDF(reactPdfFormData, template, customization, onProgress);
      
      // Return empty blob since React-PDF handles the download
      return new Blob();
    } catch (error) {
      console.error('React-PDF generation failed, falling back to server:', error);
      // Fall through to server-side generation
    }
  }
  
  // Server-side generation (for email attachments or if client-side fails)
  const apiUrl = '/api/generate-pdf';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyData: {
          propertyType: formData.propertyType,
          address: formData.address,
          price: formData.price,
          surface: formData.livingArea || '',
          rooms: formData.roomCount || '',
          bedrooms: formData.bedrooms || '',
          bathrooms: formData.bathrooms || '',
          constructionYear: formData.constructionYear || '',
          description: formData.propertyDescription || '',
          highlights: formData.keyPoints ? formData.keyPoints.split(',').map((h: string) => h.trim()) : [],
          photos: photoDataUrls,  // Use converted photo URLs
          agentName: formData.agentName || '',
          agentPhone: formData.agentPhone || '',
          agentEmail: formData.agentEmail,
          agencyName: formData.agencyName || '',
        },
        customizations: {
          template: formData.pdfTemplate || 'modern',
          colors: {
            primary: formData.pdfColorPrimary,
            secondary: formData.pdfColorSecondary,
            accent: formData.pdfColorAccent,
          },
          logo: logoDataUrl,  // Use converted logo URL
          layout: {
            photoStyle: formData.pdfPhotoLayout || 'grid',
            photoColumns: formData.pdfPhotoColumns || 2,
            showAgent: formData.pdfShowAgent !== false,
            showSocial: formData.pdfShowSocial !== false,
            showAI: formData.pdfShowAI !== false,
          }
        },
        aiContent: formData.aiContent || {}
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error || 'PDF generation failed';
      
      switch (response.status) {
        case 400:
          errorMessage = errorData.details || 'Données invalides pour la génération du PDF';
          break;
        case 413:
          errorMessage = 'La taille de la requête dépasse le maximum autorisé';
          break;
        case 504:
          errorMessage = 'La génération du PDF a pris trop de temps. Essayez avec moins de photos.';
          break;
        default:
          errorMessage = `Erreur lors de la génération du PDF: ${errorMessage}`;
      }
      
      throw new PDFServiceError(errorMessage, response.status, undefined, errorData);
    }
    
    // Get the response as JSON (contains base64 PDF)
    const data = await response.json();
    
    if (!data.success || !data.pdf) {
      throw new PDFServiceError('Format de réponse PDF invalide', 500);
    }
    
    // Convert base64 to blob
    const binaryString = atob(data.pdf);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
    
    return pdfBlob;
    
  } catch (error) {
    console.error('Server PDF generation failed:', error);
    
    // Try client-side fallback for specific error conditions
    const shouldFallback = 
      (error instanceof PDFServiceError && 
        (error.status === 504 || error.status === 500 || error.code === 'NETWORK_ERROR')) ||
      (error instanceof TypeError && error.message.includes('fetch'));
    
    if (shouldFallback) {
      console.log('Attempting client-side PDF generation as fallback...');
      try {
        // Dynamic import to avoid loading the client PDF service unless needed
        const { generatePDFClient } = await import('./clientPdfService');
        
        // Create a temporary div with the property data
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-pdf-fallback';
        tempDiv.style.cssText = 'position: absolute; left: -9999px; width: 800px;';
        tempDiv.innerHTML = await createHTMLContent(formData, photoDataUrls, logoDataUrl);
        document.body.appendChild(tempDiv);
        
        // Generate PDF client-side
        await generatePDFClient('temp-pdf-fallback', 
          `dossier-${formData.address?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'property'}.pdf`);
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        // Return empty blob since client-side generation handles download
        return new Blob();
      } catch (fallbackError) {
        console.error('Client-side fallback also failed:', fallbackError);
        // Continue to throw original error
      }
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new PDFServiceError(
        'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // Re-throw PDFServiceError
    if (error instanceof PDFServiceError) {
      throw error;
    }
    
    // Handle unexpected errors
    throw new PDFServiceError(
      'Une erreur inattendue s\'est produite lors de la génération du PDF.',
      500,
      undefined
    );
  }
};

// Helper function to create HTML content for client-side fallback
const createHTMLContent = async (
  formData: PDFFormData, 
  photoUrls: string[], 
  logoUrl: string
): Promise<string> => {
  const primaryColor = formData.pdfColorPrimary || '#2563eb';
  const secondaryColor = formData.pdfColorSecondary || '#1e40af';
  
  const photosHtml = photoUrls.length > 0 ? `
    <div class="photos-section">
      <h2>Galerie Photos</h2>
      <div class="photos-grid" style="display: grid; grid-template-columns: repeat(${formData.pdfPhotoColumns || 2}, 1fr); gap: 10px;">
        ${photoUrls.map(url => `<img src="${url}" style="width: 100%; height: auto; border-radius: 8px;" />`).join('')}
      </div>
    </div>
  ` : '';
  
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
      ${logoUrl ? `<img src="${logoUrl}" style="max-width: 200px; margin-bottom: 20px;" />` : ''}
      
      <h1 style="color: ${primaryColor}; margin-bottom: 10px;">${formData.propertyType || 'Propriété'}</h1>
      <h2 style="color: ${secondaryColor}; margin-bottom: 20px;">${formData.address || ''}</h2>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0;">
        <div style="text-align: center;">
          <div style="font-size: 24px; color: ${primaryColor}; font-weight: bold;">${formData.price || ''}</div>
          <div style="color: #666;">PRIX</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; color: ${primaryColor}; font-weight: bold;">${formData.livingArea || ''} m²</div>
          <div style="color: #666;">SURFACE</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; color: ${primaryColor}; font-weight: bold;">${formData.roomCount || ''}</div>
          <div style="color: #666;">PIÈCES</div>
        </div>
      </div>
      
      ${formData.propertyDescription ? `
        <div style="margin: 30px 0;">
          <h3 style="color: ${primaryColor}; margin-bottom: 10px;">Description</h3>
          <p style="line-height: 1.6;">${formData.propertyDescription}</p>
        </div>
      ` : ''}
      
      ${formData.keyPoints ? `
        <div style="margin: 30px 0;">
          <h3 style="color: ${primaryColor}; margin-bottom: 10px;">Points Clés</h3>
          <ul style="line-height: 1.6;">
            ${formData.keyPoints.split(',').map(point => `<li>${point.trim()}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${photosHtml}
      
      <div style="margin-top: 40px; padding: 20px; background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}); color: white; border-radius: 10px;">
        <h3 style="margin-bottom: 10px;">Votre Contact</h3>
        <div>${formData.agentName || ''}</div>
        <div>${formData.agentEmail}</div>
        <div>${formData.agentPhone || ''}</div>
        <div>${formData.agencyName || ''}</div>
      </div>
    </div>
  `;
};

// Helper function to download the PDF
export const downloadPDF = (blob: Blob, filename?: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `dossier-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};