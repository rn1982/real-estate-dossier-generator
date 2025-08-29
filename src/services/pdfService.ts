export class PDFServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PDFServiceError';
  }
}

export const generatePDF = async (data: any): Promise<Blob> => {
  const apiUrl = '/api/generate-pdf';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyData: {
          propertyType: data.propertyType,
          address: data.address,
          price: data.price,
          surface: data.livingArea || '',
          rooms: data.roomCount || '',
          bedrooms: data.bedrooms || '',
          bathrooms: data.bathrooms || '',
          constructionYear: data.constructionYear || '',
          description: data.propertyDescription || '',
          highlights: data.keyPoints ? data.keyPoints.split(',').map((h: string) => h.trim()) : [],
          photos: data.photoUrls || [],
          agentName: data.agentName || '',
          agentPhone: data.agentPhone || '',
          agentEmail: data.agentEmail,
          agencyName: data.agencyName || '',
        },
        customizations: {
          template: data.pdfTemplate || 'modern',
          colors: {
            primary: data.pdfColorPrimary,
            secondary: data.pdfColorSecondary,
            accent: data.pdfColorAccent,
          },
          logo: data.pdfLogo || '',
          layout: {
            photoStyle: data.pdfPhotoLayout || 'grid',
            photoColumns: data.pdfPhotoColumns || 2,
            showAgent: data.pdfShowAgent !== false,
            showSocial: data.pdfShowSocial !== false,
            showAI: data.pdfShowAI !== false,
          }
        },
        aiContent: data.aiContent || {}
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