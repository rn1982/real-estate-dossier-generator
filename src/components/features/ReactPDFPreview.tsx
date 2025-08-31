import React, { useState, useMemo } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import ModernTemplate from '@/components/pdf/templates/ModernTemplate';
import ClassicTemplate from '@/components/pdf/templates/ClassicTemplate';
import LuxuryTemplate from '@/components/pdf/templates/LuxuryTemplate';
import type { PDFDocument } from '@/services/reactPdfService';

interface ReactPDFPreviewProps {
  template: 'modern' | 'classic' | 'luxury';
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logo?: string;
  photoLayout: 'grid' | 'list' | 'carousel';
  photoColumns: 1 | 2 | 3;
  showAI: boolean;
}

// Sample data for preview
const SAMPLE_DATA: PDFDocument = {
  template: 'modern',
  property: {
    title: 'Villa Moderne avec Vue Lac',
    type: 'Villa individuelle',
    price: "1'250'000 CHF",
    location: {
      address: 'Chemin du Lac 42',
      city: 'Lausanne',
      postalCode: '1007',
      canton: 'Vaud',
    },
    details: {
      rooms: '6.5',
      bedrooms: '4',
      bathrooms: '3',
      livingSpace: '240',
      plotSize: '850',
      yearBuilt: '2018',
      floors: '2',
    },
    features: ['Vue lac', 'Jardin', 'Garage double', 'Cuisine équipée', 'Panneaux solaires'],
    description: 'Magnifique villa moderne avec vue imprenable sur le lac Léman. Située dans un quartier calme et résidentiel, cette propriété offre un cadre de vie exceptionnel avec des finitions haut de gamme.',
    transports: ['Gare CFF à 10 min', 'Bus à 200m', 'Autoroute à 5 min'],
    schools: ['École primaire à 500m', 'Collège à 1km', 'Gymnase à 15 min'],
    shops: ['Centre commercial à 5 min', 'Épicerie à 300m', 'Pharmacie à 400m'],
    energyRating: 'A',
  },
  customization: {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      text: '#1F2937',
      background: '#FFFFFF',
    },
    layout: {
      photoLayout: 'grid',
      columns: 2,
      showMap: false,
      showAmenities: true,
    },
  },
  photos: [
    {
      id: '1',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjQwMCIgeT0iMzAwIiBzdHlsZT0iZmlsbDojOTk5O2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjUwcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+ODAweCA2MDA8L3RleHQ+PC9zdmc+',
      caption: 'Vue extérieure',
      width: 800,
      height: 600,
    },
    {
      id: '2',
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2QwZDBkMCIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjQwMCIgeT0iMzAwIiBzdHlsZT0iZmlsbDojODg4O2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjUwcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+U2Fsb248L3RleHQ+PC9zdmc+',
      caption: 'Salon',
      width: 800,
      height: 600,
    },
  ],
  aiContent: {
    sellingPoints: [
      'Vue panoramique sur le lac Léman',
      'Construction récente avec normes énergétiques modernes',
      'Quartier calme et familial',
    ],
    investmentAdvice: 'Excellent potentiel de valorisation dans cette zone prisée de Lausanne.',
    neighborhoodInsights: 'Quartier résidentiel recherché avec excellentes écoles et transports.',
  },
};

export const ReactPDFPreview: React.FC<ReactPDFPreviewProps> = ({
  template,
  colors,
  logo,
  photoLayout,
  photoColumns,
  showAI,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const documentData = useMemo(() => {
    const doc = { ...SAMPLE_DATA };
    doc.template = template;
    doc.customization = {
      ...doc.customization,
      colors: {
        primary: colors.primary || '#3B82F6',
        secondary: colors.secondary || '#10B981',
        accent: colors.accent || '#F59E0B',
        text: '#1F2937',
        background: '#FFFFFF',
      },
      logo,
      layout: {
        photoLayout,
        columns: photoColumns,
        showMap: false,
        showAmenities: showAI,
      },
    };
    if (!showAI) {
      doc.aiContent = undefined;
    }
    return doc;
  }, [template, colors, logo, photoLayout, photoColumns, showAI]);

  const TemplateComponent = useMemo(() => {
    switch (template) {
      case 'classic':
        return ClassicTemplate;
      case 'luxury':
        return LuxuryTemplate;
      default:
        return ModernTemplate;
    }
  }, [template]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsPreviewOpen(true)}
        variant="outline"
        size="sm"
      >
        Aperçu du modèle
      </Button>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Aperçu du modèle - {template === 'modern' ? 'Moderne' : template === 'classic' ? 'Classique' : 'Luxe'}
              </h3>
              <Button
                onClick={() => setIsPreviewOpen(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden">
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <TemplateComponent document={documentData} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};