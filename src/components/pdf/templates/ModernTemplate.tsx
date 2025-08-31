import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PDFDocument } from '@/services/reactPdfService';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 300,
    marginBottom: 30,
    objectFit: 'cover',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3B82F6',
    textAlign: 'center',
  },
  propertyType: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 30,
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 5,
    textAlign: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 20,
  },
  detailItem: {
    width: '50%',
    padding: 10,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 15,
    marginTop: 30,
  },
  description: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'justify',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  featureItem: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#3B82F6',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    borderRadius: 4,
  },
  photoCaption: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  amenitiesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  amenityCategory: {
    marginBottom: 12,
  },
  amenityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  amenityList: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 10,
    color: '#9CA3AF',
  },
  energyBadge: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  aiInsightBox: {
    backgroundColor: '#FEF3C7',
    border: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  aiInsightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  aiInsightText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 1.5,
  },
});

interface ModernTemplateProps {
  document: PDFDocument;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ document }) => {
  const { property, photos, customization, aiContent } = document;
  const colors = customization.colors;
  
  // Apply custom colors
  const themedStyles = StyleSheet.create({
    title: { ...styles.title, color: colors.primary },
    price: { ...styles.price, color: colors.secondary },
    sectionTitle: { ...styles.sectionTitle, color: colors.primary },
    featureItem: { 
      ...styles.featureItem, 
      backgroundColor: `${colors.primary}10` 
    },
    featureText: { ...styles.featureText, color: colors.primary },
  });

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {photos[0] && (
            <Image style={styles.heroImage} src={photos[0].url} />
          )}
          
          <Text style={themedStyles.title}>{property.title}</Text>
          <Text style={styles.propertyType}>{property.type}</Text>
          <Text style={themedStyles.price}>{property.price}</Text>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{property.location.address}</Text>
            <Text style={styles.locationText}>
              {property.location.postalCode} {property.location.city}
            </Text>
            <Text style={styles.locationText}>{property.location.canton}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Généré le {new Date().toLocaleDateString('fr-CH')}
          </Text>
        </View>
      </Page>

      {/* Details Page */}
      <Page size="A4" style={styles.page}>
        <Text style={themedStyles.sectionTitle}>Détails du bien</Text>
        
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pièces</Text>
            <Text style={styles.detailValue}>{property.details.rooms}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chambres</Text>
            <Text style={styles.detailValue}>{property.details.bedrooms}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Salles de bain</Text>
            <Text style={styles.detailValue}>{property.details.bathrooms}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Surface habitable</Text>
            <Text style={styles.detailValue}>{property.details.livingSpace} m²</Text>
          </View>
          
          {property.details.plotSize && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Surface parcelle</Text>
              <Text style={styles.detailValue}>{property.details.plotSize} m²</Text>
            </View>
          )}
          
          {property.details.yearBuilt && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Année de construction</Text>
              <Text style={styles.detailValue}>{property.details.yearBuilt}</Text>
            </View>
          )}
          
          {property.details.floors && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Étages</Text>
              <Text style={styles.detailValue}>{property.details.floors}</Text>
            </View>
          )}
        </View>

        {property.energyRating && (
          <View style={styles.energyBadge}>
            <Text>Classe énergétique: {property.energyRating}</Text>
          </View>
        )}

        <Text style={themedStyles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.features.length > 0 && (
          <>
            <Text style={themedStyles.sectionTitle}>Caractéristiques</Text>
            <View style={styles.featuresContainer}>
              {property.features.map((feature, index) => (
                <View key={index} style={themedStyles.featureItem}>
                  <Text style={themedStyles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {aiContent?.sellingPoints && aiContent.sellingPoints.length > 0 && (
          <View style={styles.aiInsightBox}>
            <Text style={styles.aiInsightTitle}>Points forts du bien</Text>
            {aiContent.sellingPoints.map((point, index) => (
              <Text key={index} style={styles.aiInsightText}>• {point}</Text>
            ))}
          </View>
        )}

        <Text style={styles.pageNumber}>2</Text>
      </Page>

      {/* Photos Page */}
      {photos.length > 1 && (
        <Page size="A4" style={styles.page}>
          <Text style={themedStyles.sectionTitle}>Galerie Photos</Text>
          
          <View style={styles.photoGrid}>
            {photos.slice(1, Math.min(9, photos.length)).map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <Image style={styles.photo} src={photo.url} />
                {photo.caption && (
                  <Text style={styles.photoCaption}>{photo.caption}</Text>
                )}
              </View>
            ))}
          </View>
          
          <Text style={styles.pageNumber}>3</Text>
        </Page>
      )}

      {/* Amenities Page */}
      {customization.layout.showAmenities && (
        <Page size="A4" style={styles.page}>
          <Text style={themedStyles.sectionTitle}>Commodités & Environs</Text>
          
          <View style={styles.amenitiesSection}>
            {property.transports && property.transports.length > 0 && (
              <View style={styles.amenityCategory}>
                <Text style={styles.amenityTitle}>Transports</Text>
                <Text style={styles.amenityList}>
                  {property.transports.join(' • ')}
                </Text>
              </View>
            )}
            
            {property.schools && property.schools.length > 0 && (
              <View style={styles.amenityCategory}>
                <Text style={styles.amenityTitle}>Écoles</Text>
                <Text style={styles.amenityList}>
                  {property.schools.join(' • ')}
                </Text>
              </View>
            )}
            
            {property.shops && property.shops.length > 0 && (
              <View style={styles.amenityCategory}>
                <Text style={styles.amenityTitle}>Commerces</Text>
                <Text style={styles.amenityList}>
                  {property.shops.join(' • ')}
                </Text>
              </View>
            )}
          </View>

          {aiContent?.neighborhoodInsights && (
            <View style={styles.aiInsightBox}>
              <Text style={styles.aiInsightTitle}>Aperçu du quartier</Text>
              <Text style={styles.aiInsightText}>{aiContent.neighborhoodInsights}</Text>
            </View>
          )}

          {aiContent?.investmentAdvice && (
            <View style={[styles.aiInsightBox, { marginTop: 15 }]}>
              <Text style={styles.aiInsightTitle}>Conseil d'investissement</Text>
              <Text style={styles.aiInsightText}>{aiContent.investmentAdvice}</Text>
            </View>
          )}
          
          <Text style={styles.pageNumber}>4</Text>
        </Page>
      )}
    </Document>
  );
};

export default ModernTemplate;