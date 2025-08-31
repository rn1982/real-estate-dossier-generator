import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PDFDocument } from '@/services/reactPdfService';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50,
    fontFamily: 'Helvetica',
  },
  header: {
    borderBottom: 2,
    borderBottomColor: '#2C3E50',
    paddingBottom: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 10,
  },
  mainImage: {
    width: '100%',
    height: 280,
    marginBottom: 30,
    border: 1,
    borderColor: '#BDC3C7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 25,
    marginBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottom: 1,
    borderBottomColor: '#ECF0F1',
  },
  infoLabel: {
    width: '40%',
    fontSize: 11,
    color: '#7F8C8D',
  },
  infoValue: {
    width: '60%',
    fontSize: 11,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 11,
    lineHeight: 1.8,
    color: '#34495E',
    textAlign: 'justify',
    marginBottom: 20,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  featureBullet: {
    fontSize: 10,
    color: '#E74C3C',
    marginRight: 8,
  },
  featureText: {
    fontSize: 11,
    color: '#34495E',
    flex: 1,
  },
  photoSection: {
    marginTop: 30,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  photoItem: {
    flex: 1,
  },
  photo: {
    width: '100%',
    height: 150,
    border: 1,
    borderColor: '#BDC3C7',
  },
  amenitiesBox: {
    backgroundColor: '#ECF0F1',
    padding: 15,
    borderRadius: 4,
    marginTop: 20,
  },
  amenityGroup: {
    marginBottom: 10,
  },
  amenityLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 10,
    color: '#7F8C8D',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: 1,
    borderTopColor: '#BDC3C7',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#95A5A6',
  },
  pageNumber: {
    fontSize: 9,
    color: '#95A5A6',
  },
  contactSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#2C3E50',
    color: '#FFFFFF',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 10,
    color: '#ECF0F1',
    lineHeight: 1.5,
  },
  energyLabel: {
    position: 'absolute',
    top: 50,
    right: 50,
    backgroundColor: '#27AE60',
    color: '#FFFFFF',
    padding: 6,
    fontSize: 10,
    fontWeight: 'bold',
  },
  classicBorder: {
    border: 2,
    borderColor: '#2C3E50',
    padding: 20,
    marginBottom: 20,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  locationIcon: {
    fontSize: 14,
    color: '#E74C3C',
    marginRight: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#34495E',
  },
});

interface ClassicTemplateProps {
  document: PDFDocument;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ document }) => {
  const { property, photos, customization, aiContent } = document;
  
  return (
    <Document>
      {/* First Page - Overview */}
      <Page size="A4" style={styles.page}>
        {property.energyRating && (
          <View style={styles.energyLabel}>
            <Text>Classe {property.energyRating}</Text>
          </View>
        )}
        
        <View style={styles.header}>
          <Text style={styles.title}>{property.title}</Text>
          <Text style={styles.subtitle}>{property.type}</Text>
          <View style={styles.locationBox}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {property.location.address}, {property.location.postalCode} {property.location.city}
            </Text>
          </View>
          <Text style={styles.price}>{property.price}</Text>
        </View>

        {photos[0] && (
          <Image style={styles.mainImage} src={photos[0].url} />
        )}

        <Text style={styles.sectionTitle}>Informations principales</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre de pièces</Text>
            <Text style={styles.infoValue}>{property.details.rooms}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chambres à coucher</Text>
            <Text style={styles.infoValue}>{property.details.bedrooms}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Salles de bain</Text>
            <Text style={styles.infoValue}>{property.details.bathrooms}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Surface habitable</Text>
            <Text style={styles.infoValue}>{property.details.livingSpace} m²</Text>
          </View>
          {property.details.plotSize && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Surface de la parcelle</Text>
              <Text style={styles.infoValue}>{property.details.plotSize} m²</Text>
            </View>
          )}
          {property.details.yearBuilt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Année de construction</Text>
              <Text style={styles.infoValue}>{property.details.yearBuilt}</Text>
            </View>
          )}
          {property.details.floors && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre d'étages</Text>
              <Text style={styles.infoValue}>{property.details.floors}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Document généré le {new Date().toLocaleDateString('fr-CH')}
          </Text>
          <Text style={styles.pageNumber}>Page 1</Text>
        </View>
      </Page>

      {/* Second Page - Description & Features */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Description du bien</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.features.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Caractéristiques et équipements</Text>
            <View style={styles.featuresList}>
              {property.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureBullet}>▪</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {aiContent?.sellingPoints && aiContent.sellingPoints.length > 0 && (
          <View style={styles.classicBorder}>
            <Text style={styles.sectionTitle}>Points forts de ce bien</Text>
            {aiContent.sellingPoints.map((point, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {customization.layout.showAmenities && (
          <View style={styles.amenitiesBox}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Commodités à proximité</Text>
            
            {property.transports && property.transports.length > 0 && (
              <View style={styles.amenityGroup}>
                <Text style={styles.amenityLabel}>Transports publics</Text>
                <Text style={styles.amenityText}>{property.transports.join(', ')}</Text>
              </View>
            )}
            
            {property.schools && property.schools.length > 0 && (
              <View style={styles.amenityGroup}>
                <Text style={styles.amenityLabel}>Établissements scolaires</Text>
                <Text style={styles.amenityText}>{property.schools.join(', ')}</Text>
              </View>
            )}
            
            {property.shops && property.shops.length > 0 && (
              <View style={styles.amenityGroup}>
                <Text style={styles.amenityLabel}>Commerces et services</Text>
                <Text style={styles.amenityText}>{property.shops.join(', ')}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {property.location.city}, {property.location.canton}
          </Text>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* Third Page - Photos */}
      {photos.length > 1 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Galerie photographique</Text>
          
          <View style={styles.photoSection}>
            {[0, 2, 4, 6].map((startIdx) => {
              const rowPhotos = photos.slice(startIdx + 1, startIdx + 3);
              if (rowPhotos.length === 0) return null;
              
              return (
                <View key={startIdx} style={styles.photoRow}>
                  {rowPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoItem}>
                      <Image style={styles.photo} src={photo.url} />
                    </View>
                  ))}
                  {rowPhotos.length === 1 && <View style={styles.photoItem} />}
                </View>
              );
            })}
          </View>

          {aiContent?.neighborhoodInsights && (
            <View style={[styles.amenitiesBox, { marginTop: 30 }]}>
              <Text style={styles.amenityLabel}>Informations sur le quartier</Text>
              <Text style={styles.amenityText}>{aiContent.neighborhoodInsights}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {property.title}
            </Text>
            <Text style={styles.pageNumber}>Page 3</Text>
          </View>
        </Page>
      )}

      {/* Last Page - Contact Information */}
      {aiContent?.investmentAdvice && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Analyse d'investissement</Text>
          
          <View style={styles.classicBorder}>
            <Text style={styles.description}>{aiContent.investmentAdvice}</Text>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Pour plus d'informations</Text>
            <Text style={styles.contactText}>
              Ce dossier a été préparé avec soin pour vous présenter ce bien d'exception.
            </Text>
            <Text style={styles.contactText}>
              N'hésitez pas à nous contacter pour organiser une visite ou obtenir des informations complémentaires.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} - Dossier immobilier confidentiel
            </Text>
            <Text style={styles.pageNumber}>Page 4</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default ClassicTemplate;