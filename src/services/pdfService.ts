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

export const generatePDF = async (formData: any): Promise<Blob> => {
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
          photos: formData.photoUrls || [],
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
          logo: formData.pdfLogo || '',
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
    
    // Get the response as blob (binary PDF data)
    const pdfBlob = await response.blob();
    
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new PDFServiceError('Format de réponse PDF invalide', 500);
    }
    
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