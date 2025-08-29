import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TemplatePreviewProps {
  template: string;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  photoLayout: 'grid' | 'list';
  photoColumns: number;
  showAgent: boolean;
  showSocial: boolean;
  showAI: boolean;
}

const TEMPLATE_STYLES = {
  modern: {
    name: 'Moderne',
    defaultColors: { primary: '#3498db', secondary: '#2c3e50', accent: '#667eea' },
    fontFamily: 'sans-serif',
  },
  classic: {
    name: 'Classique',
    defaultColors: { primary: '#8B7355', secondary: '#2F4F4F', accent: '#DAA520' },
    fontFamily: 'serif',
  },
  luxury: {
    name: 'Luxe',
    defaultColors: { primary: '#FFD700', secondary: '#000000', accent: '#C9A961' },
    fontFamily: 'serif',
  },
  corporate: {
    name: 'Corporate',
    defaultColors: { primary: '#34495e', secondary: '#2c3e50', accent: '#3498db' },
    fontFamily: 'sans-serif',
  },
  eco: {
    name: 'Éco',
    defaultColors: { primary: '#27ae60', secondary: '#2c3e50', accent: '#16a085' },
    fontFamily: 'sans-serif',
  },
};

// Cache for storing rendered preview content
const previewCache = new Map<string, React.ReactElement>();

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  colors,
  photoLayout,
  photoColumns,
  showAgent,
  showSocial,
  showAI,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const templateStyle = TEMPLATE_STYLES[template as keyof typeof TEMPLATE_STYLES] || TEMPLATE_STYLES.modern;
  const finalColors = {
    primary: colors.primary || templateStyle.defaultColors.primary,
    secondary: colors.secondary || templateStyle.defaultColors.secondary,
    accent: colors.accent || templateStyle.defaultColors.accent,
  };

  // Generate cache key based on all preview parameters
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      template,
      colors: finalColors,
      photoLayout,
      photoColumns,
      showAgent,
      showSocial,
      showAI,
    });
  }, [template, finalColors, photoLayout, photoColumns, showAgent, showSocial, showAI]);

  // Memoize the preview content
  const previewContent = useMemo(() => {
    // Check if we have cached content
    if (previewCache.has(cacheKey)) {
      return previewCache.get(cacheKey);
    }

    // Generate the preview content
    const content = (
      <div
        className="border rounded-lg p-6"
        style={{ fontFamily: templateStyle.fontFamily }}
      >
        {/* Cover Page Preview */}
        <div className="mb-8">
          <div
            className="h-48 rounded-lg mb-4"
            style={{ backgroundColor: finalColors.secondary }}
          />
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: finalColors.secondary }}
          >
            Appartement de Luxe
          </h1>
          <p className="text-gray-600 mb-4">
            15 Rue de la Paix, 75002 Paris
          </p>
          <div className="flex gap-4">
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: finalColors.primary }}
              >
                850 000 €
              </div>
              <div className="text-sm text-gray-500">Prix</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: finalColors.primary }}
              >
                120 m²
              </div>
              <div className="text-sm text-gray-500">Surface</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: finalColors.primary }}
              >
                5
              </div>
              <div className="text-sm text-gray-500">Pièces</div>
            </div>
          </div>
        </div>

        {/* AI Narrative Preview */}
        {showAI && (
          <div className="mb-6">
            <h2
              className="text-xl font-semibold mb-3 pb-2 border-b-2"
              style={{ 
                color: finalColors.secondary,
                borderBottomColor: finalColors.primary 
              }}
            >
              Présentation du Bien
            </h2>
            <div
              className="p-4 rounded border-l-4"
              style={{ 
                backgroundColor: '#f8f9fa',
                borderLeftColor: finalColors.primary 
              }}
            >
              <p className="text-gray-700">
                Découvrez ce magnifique appartement avec des volumes généreux
                et une luminosité exceptionnelle...
              </p>
            </div>
          </div>
        )}

        {/* Photo Gallery Preview */}
        <div className="mb-6">
          <h2
            className="text-xl font-semibold mb-3 pb-2 border-b-2"
            style={{ 
              color: finalColors.secondary,
              borderBottomColor: finalColors.primary 
            }}
          >
            Galerie Photos
          </h2>
          <div
            className={`${
              photoLayout === 'grid' 
                ? `grid gap-2`
                : 'flex flex-col gap-4'
            }`}
            style={{
              gridTemplateColumns: photoLayout === 'grid' 
                ? `repeat(${photoColumns}, 1fr)` 
                : undefined
            }}
          >
            {[1, 2, 3, 4].slice(0, photoColumns).map((i) => (
              <div
                key={i}
                className="rounded"
                style={{ 
                  backgroundColor: finalColors.accent,
                  height: photoLayout === 'grid' ? '100px' : '150px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Social Media Preview */}
        {showSocial && (
          <div className="mb-6">
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: finalColors.secondary }}
            >
              Contenu Réseaux Sociaux
            </h3>
            <div
              className="p-3 rounded border-l-3"
              style={{ 
                borderLeftColor: finalColors.primary,
                borderLeftWidth: '3px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div
                className="text-sm font-semibold mb-1"
                style={{ color: finalColors.primary }}
              >
                INSTAGRAM
              </div>
              <p className="text-sm text-gray-700">
                🏠 COUP DE CŒUR ASSURÉ ! Sublime appartement...
              </p>
            </div>
          </div>
        )}

        {/* Agent Section Preview */}
        {showAgent && (
          <div
            className="p-4 rounded text-white"
            style={{ 
              background: `linear-gradient(135deg, ${finalColors.accent} 0%, ${finalColors.primary} 100%)`
            }}
          >
            <h3 className="text-lg font-semibold mb-3">
              Votre Contact
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>Agent: Marie Dubois</div>
              <div>Tél: 01 42 56 78 90</div>
              <div>Email: agent@immobilier.fr</div>
              <div>Agence: Immobilier Prestige</div>
            </div>
          </div>
        )}
      </div>
    );

    // Cache the content (limit cache size to 10 entries)
    if (previewCache.size >= 10) {
      const firstKey = previewCache.keys().next().value;
      previewCache.delete(firstKey);
    }
    previewCache.set(cacheKey, content);

    return content;
  }, [cacheKey, templateStyle, finalColors, photoLayout, photoColumns, showAgent, showSocial, showAI]);

  const handlePreview = async () => {
    // If content is already cached, no loading needed
    if (previewCache.has(cacheKey)) {
      setIsPreviewOpen(true);
      return;
    }

    setIsLoading(true);
    setIsPreviewOpen(true);
    
    // Simulate rendering time for uncached content
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handlePreview}
        className="w-full"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Aperçu du modèle
      </Button>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Aperçu - Modèle {templateStyle.name}
              </h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                previewContent
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};