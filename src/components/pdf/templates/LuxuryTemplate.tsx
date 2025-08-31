import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PDFDocument } from '@/services/reactPdfService';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FAFAFA',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 60,
  },
  luxuryTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 15,
  },
  luxurySubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 30,
  },
  goldDivider: {
    width: 80,
    height: 1,
    backgroundColor: '#D4AF37',
    marginVertical: 20,
  },
  priceTag: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1,
    marginTop: 20,
  },
  heroImageContainer: {
    width: '100%',
    height: 350,
    marginVertical: 40,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    padding: 20,
    justifyContent: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1,
  },
  sectionHeader: {
    marginTop: 40,
    marginBottom: 25,
    borderBottom: 1,
    borderBottomColor: '#D4AF37',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1A1A1A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  elegantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  elegantItem: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  elegantLabel: {
    fontSize: 9,
    color: '#8B7355',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  elegantValue: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  luxuryDescription: {
    fontSize: 12,
    lineHeight: 2,
    color: '#4A4A4A',
    textAlign: 'justify',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  luxuryFeature: {
    width: '33.33%',
    padding: 10,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    color: '#D4AF37',
    marginBottom: 5,
  },
  luxuryFeatureText: {
    fontSize: 10,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  photoGallery: {
    marginTop: 30,
  },
  galleryRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  galleryPhoto: {
    flex: 1,
    height: 180,
    objectFit: 'cover',
  },
  singlePhoto: {
    width: '100%',
    height: 250,
    marginBottom: 15,
    objectFit: 'cover',
  },
  luxuryAmenities: {
    backgroundColor: '#F5F5F5',
    padding: 25,
    marginVertical: 20,
  },
  amenityRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  amenityIcon: {
    width: 30,
    fontSize: 12,
    color: '#D4AF37',
  },
  amenityContent: {
    flex: 1,
  },
  amenityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  amenityDetail: {
    fontSize: 10,
    color: '#6B6B6B',
    lineHeight: 1.4,
  },
  exclusiveBox: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    marginVertical: 20,
  },
  exclusiveTitle: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  exclusiveText: {
    fontSize: 11,
    color: '#FFFFFF',
    lineHeight: 1.6,
  },
  footerLuxury: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 10,
    color: '#8B7355',
    letterSpacing: 2,
  },
  pageNumberLuxury: {
    fontSize: 10,
    color: '#8B7355',
  },
  locationPrestige: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  locationTextPrestige: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  energyBadgeLuxury: {
    position: 'absolute',
    top: 60,
    right: 60,
    backgroundColor: '#D4AF37',
    color: '#1A1A1A',
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    right: 60,
    width: 140,
    height: 70,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
});

interface LuxuryTemplateProps {
  document: PDFDocument;
}

const LuxuryTemplate: React.FC<LuxuryTemplateProps> = ({ document }) => {
  const { property, photos, customization, aiContent } = document;
  
  return (
    <Document>
      {/* Cover Page - Prestige Presentation */}
      <Page size="A4" style={[styles.page, { padding: 0 }]}>
        <View style={styles.coverPage}>
          <View style={styles.goldDivider} />
          <Text style={styles.luxurySubtitle}>Présentation Exclusive</Text>
          <Text style={styles.luxuryTitle}>{property.title}</Text>
          <Text style={styles.luxurySubtitle}>{property.type}</Text>
          <View style={styles.goldDivider} />
          
          {photos[0] && (
            <View style={styles.heroImageContainer}>
              <Image style={styles.heroImage} src={photos[0].url} />
            </View>
          )}
          
          <View style={styles.locationPrestige}>
            <Text style={styles.locationTextPrestige}>
              {property.location.address} • {property.location.city}
            </Text>
          </View>
          
          <Text style={styles.priceTag}>{property.price}</Text>
        </View>
      </Page>

      {/* Details Page - Refined Information */}
      <Page size="A4" style={styles.page}>
        {customization.logo && (
          <View style={styles.logoContainer}>
            <Image style={styles.logo} src={customization.logo} />
          </View>
        )}
        
        {property.energyRating && (
          <View style={styles.energyBadgeLuxury}>
            <Text>CLASSE {property.energyRating}</Text>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Caractéristiques Exceptionnelles</Text>
        </View>
        
        <View style={styles.elegantGrid}>
          <View style={styles.elegantItem}>
            <Text style={styles.elegantLabel}>Pièces</Text>
            <Text style={styles.elegantValue}>{property.details.rooms}</Text>
          </View>
          <View style={styles.elegantItem}>
            <Text style={styles.elegantLabel}>Chambres</Text>
            <Text style={styles.elegantValue}>{property.details.bedrooms}</Text>
          </View>
          <View style={styles.elegantItem}>
            <Text style={styles.elegantLabel}>Salles de Bain</Text>
            <Text style={styles.elegantValue}>{property.details.bathrooms}</Text>
          </View>
          <View style={styles.elegantItem}>
            <Text style={styles.elegantLabel}>Surface Habitable</Text>
            <Text style={styles.elegantValue}>{property.details.livingSpace} m²</Text>
          </View>
          {property.details.plotSize && (
            <View style={styles.elegantItem}>
              <Text style={styles.elegantLabel}>Terrain</Text>
              <Text style={styles.elegantValue}>{property.details.plotSize} m²</Text>
            </View>
          )}
          {property.details.yearBuilt && (
            <View style={styles.elegantItem}>
              <Text style={styles.elegantLabel}>Construction</Text>
              <Text style={styles.elegantValue}>{property.details.yearBuilt}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Description du Bien</Text>
        </View>
        <Text style={styles.luxuryDescription}>{property.description}</Text>

        {aiContent?.sellingPoints && aiContent.sellingPoints.length > 0 && (
          <View style={styles.exclusiveBox}>
            <Text style={styles.exclusiveTitle}>Points d'Excellence</Text>
            {aiContent.sellingPoints.map((point, index) => (
              <Text key={index} style={styles.exclusiveText}>• {point}</Text>
            ))}
          </View>
        )}

        {property.features.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Équipements Premium</Text>
            </View>
            <View style={styles.featureGrid}>
              {property.features.slice(0, 9).map((feature, index) => (
                <View key={index} style={styles.luxuryFeature}>
                  <Text style={styles.featureIcon}>◆</Text>
                  <Text style={styles.luxuryFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.footerLuxury}>
          <Text style={styles.footerLogo}>EXCLUSIVE PROPERTIES</Text>
          <Text style={styles.pageNumberLuxury}>02</Text>
        </View>
      </Page>

      {/* Gallery Page - Visual Excellence */}
      {photos.length > 1 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Galerie Photographique</Text>
          </View>
          
          <View style={styles.photoGallery}>
            {photos.length > 2 && (
              <Image style={styles.singlePhoto} src={photos[1].url} />
            )}
            
            {photos.length > 4 && (
              <View style={styles.galleryRow}>
                <Image style={styles.galleryPhoto} src={photos[2].url} />
                <Image style={styles.galleryPhoto} src={photos[3].url} />
              </View>
            )}
            
            {photos.length > 6 && (
              <View style={styles.galleryRow}>
                <Image style={styles.galleryPhoto} src={photos[4].url} />
                <Image style={styles.galleryPhoto} src={photos[5].url} />
                <Image style={styles.galleryPhoto} src={photos[6].url} />
              </View>
            )}
          </View>

          <View style={styles.footerLuxury}>
            <Text style={styles.footerLogo}>EXCLUSIVE PROPERTIES</Text>
            <Text style={styles.pageNumberLuxury}>03</Text>
          </View>
        </Page>
      )}

      {/* Lifestyle & Location Page */}
      {customization.layout.showAmenities && (
        <Page size="A4" style={styles.page}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Art de Vivre & Environnement</Text>
          </View>

          <View style={styles.luxuryAmenities}>
            {property.transports && property.transports.length > 0 && (
              <View style={styles.amenityRow}>
                <Text style={styles.amenityIcon}>✈</Text>
                <View style={styles.amenityContent}>
                  <Text style={styles.amenityTitle}>Accessibilité</Text>
                  <Text style={styles.amenityDetail}>
                    {property.transports.join(' • ')}
                  </Text>
                </View>
              </View>
            )}
            
            {property.schools && property.schools.length > 0 && (
              <View style={styles.amenityRow}>
                <Text style={styles.amenityIcon}>🎓</Text>
                <View style={styles.amenityContent}>
                  <Text style={styles.amenityTitle}>Éducation</Text>
                  <Text style={styles.amenityDetail}>
                    {property.schools.join(' • ')}
                  </Text>
                </View>
              </View>
            )}
            
            {property.shops && property.shops.length > 0 && (
              <View style={styles.amenityRow}>
                <Text style={styles.amenityIcon}>🛍</Text>
                <View style={styles.amenityContent}>
                  <Text style={styles.amenityTitle}>Shopping & Services</Text>
                  <Text style={styles.amenityDetail}>
                    {property.shops.join(' • ')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {aiContent?.neighborhoodInsights && (
            <View style={styles.exclusiveBox}>
              <Text style={styles.exclusiveTitle}>Le Quartier</Text>
              <Text style={styles.exclusiveText}>{aiContent.neighborhoodInsights}</Text>
            </View>
          )}

          {aiContent?.investmentAdvice && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Opportunité d'Investissement</Text>
              </View>
              <Text style={styles.luxuryDescription}>{aiContent.investmentAdvice}</Text>
            </>
          )}

          <View style={[styles.exclusiveBox, { marginTop: 40 }]}>
            <Text style={styles.exclusiveTitle}>Service Conciergerie</Text>
            <Text style={styles.exclusiveText}>
              Notre équipe dédiée est à votre disposition pour organiser une visite privée 
              et vous accompagner dans votre projet d'acquisition.
            </Text>
          </View>

          <View style={styles.footerLuxury}>
            <Text style={styles.footerLogo}>EXCLUSIVE PROPERTIES</Text>
            <Text style={styles.pageNumberLuxury}>04</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default LuxuryTemplate;