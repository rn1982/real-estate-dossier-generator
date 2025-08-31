import { Font, pdf } from '@react-pdf/renderer';
import React from 'react';

// Register fonts for French character support
// Using web-safe fonts that support French characters
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0e.ttf',
});

Font.register({
  family: 'Helvetica-Bold',
  src: 'https://fonts.gstatic.com/s/opensans/v18/mem5YaGs126MiZpBA-UN7rgOUuhs.ttf',
  fontWeight: 'bold',
});

// PDF Document Structure Interfaces
export interface PDFDocument {
  template: 'modern' | 'classic' | 'luxury';
  property: PropertyData;
  customization: {
    colors: ColorScheme;
    logo?: string;
    layout: LayoutOptions;
  };
  photos: ProcessedPhoto[];
  aiContent?: AIContent;
}

export interface PropertyData {
  title: string;
  type: string;
  price: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
    canton: string;
  };
  details: {
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    livingSpace: string;
    plotSize?: string;
    yearBuilt?: string;
    floors?: string;
  };
  features: string[];
  description: string;
  transports?: string[];
  schools?: string[];
  shops?: string[];
  energyRating?: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

export interface LayoutOptions {
  photoLayout: 'grid' | 'list' | 'carousel';
  columns: 1 | 2 | 3;
  showMap: boolean;
  showAmenities: boolean;
}

export interface ProcessedPhoto {
  id: string;
  url: string;
  caption?: string;
  width: number;
  height: number;
}

export interface AIContent {
  sellingPoints: string[];
  investmentAdvice?: string;
  neighborhoodInsights?: string;
}

// Utility functions for Swiss formatting
export const formatSwissPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseInt(price.replace(/\D/g, '')) : price;
  return `${numPrice.toLocaleString('fr-CH').replace(/\s/g, "'")} CHF`;
};

export const formatSwissDate = (date: Date): string => {
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Base styles (unused - kept for reference)
// const baseStyles = StyleSheet.create({
//   page: {
//     flexDirection: 'column',
//     backgroundColor: '#FFFFFF',
//     padding: 40,
//   },
//   section: {
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   subtitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   text: {
//     fontSize: 12,
//     marginBottom: 4,
//     lineHeight: 1.5,
//   },
//   label: {
//     fontSize: 10,
//     color: '#666666',
//     marginBottom: 2,
//   },
//   row: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   column: {
//     flex: 1,
//   },
// });

// Convert FormData to PropertyData
export const formDataToPropertyData = (formData: Record<string, unknown>): PropertyData => {
  return {
    title: formData.propertyTitle,
    type: formData.propertyType,
    price: formatSwissPrice(formData.price),
    location: {
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      canton: formData.canton,
    },
    details: {
      rooms: formData.rooms,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      livingSpace: formData.livingSpace,
      plotSize: formData.plotSize,
      yearBuilt: formData.yearBuilt,
      floors: formData.floors,
    },
    features: formData.features || [],
    description: formData.description,
    transports: formData.transports,
    schools: formData.schools,
    shops: formData.shops,
    energyRating: formData.energyRating,
  };
};

// Process photos for PDF embedding
export const processPhotosForPDF = async (photos: File[]): Promise<ProcessedPhoto[]> => {
  const processedPhotos: ProcessedPhoto[] = [];
  
  for (let i = 0; i < Math.min(photos.length, 20); i++) {
    const photo = photos[i];
    const url = await fileToBase64(photo);
    const dimensions = await getImageDimensions(url);
    
    processedPhotos.push({
      id: `photo-${i}`,
      url,
      width: dimensions.width,
      height: dimensions.height,
    });
  }
  
  return processedPhotos;
};

// Convert file to base64 with optimization
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Resize if needed (max 1200px width)
        let width = img.width;
        let height = img.height;
        if (width > 1200) {
          height = (height * 1200) / width;
          width = 1200;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.85 quality
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(optimizedUrl);
      };
      
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Get image dimensions
const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = url;
  });
};

// Main PDF generation function
export const generatePDFDocument = async (
  formData: Record<string, unknown>,
  template: 'modern' | 'classic' | 'luxury' = 'modern',
  customization?: Partial<PDFDocument['customization']>
): Promise<Blob> => {
  const propertyData = formDataToPropertyData(formData);
  const processedPhotos = formData.photos ? await processPhotosForPDF(formData.photos) : [];
  
  const pdfDocument: PDFDocument = {
    template,
    property: propertyData,
    customization: {
      colors: customization?.colors || getDefaultColors(template),
      logo: customization?.logo,
      layout: customization?.layout || {
        photoLayout: 'grid',
        columns: 2,
        showMap: true,
        showAmenities: true,
      },
    },
    photos: processedPhotos,
    aiContent: formData.aiContent,
  };
  
  // Select template component based on type
  let TemplateComponent: React.ComponentType<{ document: PDFDocument }>;
  
  switch (template) {
    case 'classic':
      TemplateComponent = (await import('@/components/pdf/templates/ClassicTemplate')).default;
      break;
    case 'luxury':
      TemplateComponent = (await import('@/components/pdf/templates/LuxuryTemplate')).default;
      break;
    case 'modern':
    default:
      TemplateComponent = (await import('@/components/pdf/templates/ModernTemplate')).default;
      break;
  }
  
  // Generate PDF blob
  // Create the document element
  const documentElement = React.createElement(TemplateComponent, { document: pdfDocument });
  const pdfBlob = await pdf(documentElement as React.ReactElement).toBlob();
  
  return pdfBlob;
};

// Get default colors for template
const getDefaultColors = (template: string): ColorScheme => {
  switch (template) {
    case 'classic':
      return {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#E74C3C',
        text: '#2C3E50',
        background: '#FFFFFF',
      };
    case 'luxury':
      return {
        primary: '#1A1A1A',
        secondary: '#D4AF37',
        accent: '#8B7355',
        text: '#1A1A1A',
        background: '#FAFAFA',
      };
    case 'modern':
    default:
      return {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
        text: '#1F2937',
        background: '#FFFFFF',
      };
  }
};

// Generate and download PDF
export const generateAndDownloadPDF = async (
  formData: Record<string, unknown>,
  template: 'modern' | 'classic' | 'luxury' = 'modern',
  customization?: Partial<PDFDocument['customization']>,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    onProgress?.(10);
    
    const pdfBlob = await generatePDFDocument(formData, template, customization);
    
    onProgress?.(90);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier-${formData.propertyTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onProgress?.(100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};