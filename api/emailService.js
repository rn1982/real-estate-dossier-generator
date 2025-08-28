import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generates HTML email template with property data
 * @param {Object} formData - Property form data
 * @param {number} photoCount - Number of photos uploaded
 * @returns {string} HTML email content
 */
function generateEmailHTML(formData, photoCount) {
  const formatPrice = (price) => {
    const numPrice = parseInt(price);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numPrice);
  };

  const propertyTypeLabel = formData.propertyType === 'apartment' ? 'Appartement' : 'Maison';
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmation de réception - Dossier immobilier</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #555;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #667eea;
          margin-top: 25px;
          margin-bottom: 15px;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 5px;
        }
        .property-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .property-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e5e5e5;
        }
        .property-table td:first-child {
          font-weight: 600;
          color: #666;
          width: 40%;
          background-color: #f9f9f9;
        }
        .property-table td:last-child {
          color: #333;
        }
        .photo-count {
          background-color: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .photo-count strong {
          color: #2e7d32;
        }
        .footer {
          background-color: #f9f9f9;
          padding: 20px 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .footer-note {
          margin-top: 20px;
          padding: 15px;
          background-color: #fff3e0;
          border-radius: 5px;
          color: #e65100;
          font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header {
            padding: 20px;
          }
          .content {
            padding: 20px;
          }
          .property-table td {
            display: block;
            width: 100%;
          }
          .property-table td:first-child {
            border-bottom: none;
            padding-bottom: 5px;
          }
          .property-table td:last-child {
            padding-top: 5px;
            padding-bottom: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Confirmation de réception</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Dossier Immobilier</p>
        </div>
        
        <div class="content">
          <p class="greeting">Bonjour,</p>
          
          <p>Nous avons bien reçu votre dossier immobilier. Voici un récapitulatif des informations soumises :</p>
          
          <h2 class="section-title">📋 Informations du bien</h2>
          
          <table class="property-table">
            <tr>
              <td>Type de bien</td>
              <td>${propertyTypeLabel}</td>
            </tr>
            <tr>
              <td>Adresse</td>
              <td>${escapeHtml(formData.address)}</td>
            </tr>
            <tr>
              <td>Prix</td>
              <td>${formatPrice(formData.price)}</td>
            </tr>
            <tr>
              <td>Acheteur cible</td>
              <td>${escapeHtml(formData.targetBuyer)}</td>
            </tr>
            ${formData.roomCount ? `
            <tr>
              <td>Nombre de pièces</td>
              <td>${escapeHtml(formData.roomCount)}</td>
            </tr>
            ` : ''}
            ${formData.livingArea ? `
            <tr>
              <td>Surface habitable</td>
              <td>${escapeHtml(formData.livingArea)} m²</td>
            </tr>
            ` : ''}
            ${formData.constructionYear ? `
            <tr>
              <td>Année de construction</td>
              <td>${escapeHtml(formData.constructionYear)}</td>
            </tr>
            ` : ''}
          </table>
          
          ${formData.keyPoints ? `
          <h2 class="section-title">✨ Points clés</h2>
          <p>${escapeHtml(formData.keyPoints).replace(/\n/g, '<br>')}</p>
          ` : ''}
          
          ${formData.propertyDescription ? `
          <h2 class="section-title">📝 Description du bien</h2>
          <p>${escapeHtml(formData.propertyDescription).replace(/\n/g, '<br>')}</p>
          ` : ''}
          
          <div class="photo-count">
            <strong>📸 Photos reçues : ${photoCount} photo${photoCount > 1 ? 's' : ''}</strong>
          </div>
          
          <div class="footer-note">
            <strong>📧 Prochaines étapes :</strong><br>
            Ce dossier sera traité dans les plus brefs délais. Vous recevrez prochainement une version enrichie avec le dossier PDF professionnel.
          </div>
        </div>
        
        <div class="footer">
          <p>Cordialement,<br>
          <strong>L'équipe Générateur de Dossier Immobilier</strong></p>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
            Cet email a été envoyé à ${escapeHtml(formData.agentEmail)}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates plain text email content as fallback
 * @param {Object} formData - Property form data
 * @param {number} photoCount - Number of photos uploaded
 * @returns {string} Plain text email content
 */
function generateEmailText(formData, photoCount) {
  const formatPrice = (price) => {
    const numPrice = parseInt(price);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numPrice);
  };

  const propertyTypeLabel = formData.propertyType === 'apartment' ? 'Appartement' : 'Maison';
  
  let text = `Confirmation de réception - Dossier immobilier

Bonjour,

Nous avons bien reçu votre dossier immobilier. Voici un récapitulatif des informations soumises :

INFORMATIONS DU BIEN
--------------------
Type de bien: ${propertyTypeLabel}
Adresse: ${formData.address}
Prix: ${formatPrice(formData.price)}
Acheteur cible: ${formData.targetBuyer}`;

  if (formData.roomCount) {
    text += `\nNombre de pièces: ${formData.roomCount}`;
  }
  if (formData.livingArea) {
    text += `\nSurface habitable: ${formData.livingArea} m²`;
  }
  if (formData.constructionYear) {
    text += `\nAnnée de construction: ${formData.constructionYear}`;
  }

  if (formData.keyPoints) {
    text += `\n\nPOINTS CLÉS\n-----------\n${formData.keyPoints}`;
  }

  if (formData.propertyDescription) {
    text += `\n\nDESCRIPTION DU BIEN\n-------------------\n${formData.propertyDescription}`;
  }

  text += `\n\nPhotos reçues : ${photoCount} photo${photoCount > 1 ? 's' : ''}

PROCHAINES ÉTAPES
-----------------
Ce dossier sera traité dans les plus brefs délais. Vous recevrez prochainement une version enrichie avec le dossier PDF professionnel.

Cordialement,
L'équipe Générateur de Dossier Immobilier

---
Cet email a été envoyé à ${formData.agentEmail}`;

  return text;
}

/**
 * Sends confirmation email with property data
 * @param {Object} formData - Property form data
 * @param {number} photoCount - Number of photos uploaded
 * @returns {Promise<Object>} Result from Resend API
 */
export async function sendConfirmationEmail(formData, photoCount) {
  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
    const fromName = process.env.EMAIL_FROM_NAME || 'Générateur de Dossier Immobilier';

    // Generate email content
    const htmlContent = generateEmailHTML(formData, photoCount);
    const textContent = generateEmailText(formData, photoCount);

    // Send email using Resend
    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: formData.agentEmail,
      subject: 'Confirmation de réception - Dossier immobilier',
      html: htmlContent,
      text: textContent,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // Return error details for debugging while not breaking the form submission
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data || error
    };
  }
}

/**
 * Validates email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export functions for testing
export default {
  sendConfirmationEmail,
  validateEmail,
  generateEmailHTML,
  generateEmailText,
};