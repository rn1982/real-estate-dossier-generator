import fetch from 'node-fetch';

/**
 * AI Service for generating real estate content using Claude API
 * Implements Story 2.1: AI Service Integration
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-haiku-20240307'; // Using Haiku for fast, cost-effective responses

/**
 * Generate property narrative and social media snippets
 * @param {Object} propertyData - The property data from the form
 * @returns {Promise<Object>} Generated content including narrative and social snippets
 */
export async function generatePropertyContent(propertyData) {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY environment variable is not set');
  }

  try {
    const prompt = buildPrompt(propertyData);
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    const generatedText = result.content[0].text;
    
    // Parse the structured response
    return parseAIResponse(generatedText);
    
  } catch (error) {
    console.error('AI content generation failed:', error);
    throw error;
  }
}

/**
 * Build the prompt for Claude API based on property data
 * @param {Object} propertyData - Property information
 * @returns {string} Formatted prompt
 */
function buildPrompt(propertyData) {
  const {
    propertyType,
    address,
    price,
    targetBuyer,
    roomCount,
    livingArea,
    constructionYear,
    keyPoints,
    propertyDescription
  } = propertyData;

  // Map target buyer enum to French descriptions
  const buyerProfiles = {
    'jeune_famille': 'jeunes familles avec enfants',
    'professionnel': 'professionnels actifs', 
    'retraite': 'personnes retraitées',
    'investisseur': 'investisseurs immobiliers',
    'premier_acheteur': 'primo-accédants',
    'famille_multigenerationnelle': 'familles multigénérationnelles'
  };

  const targetProfile = buyerProfiles[targetBuyer] || 'acheteurs potentiels';

  return `Tu es un agent immobilier expert français spécialisé dans la création de contenus marketing professionnels.

DONNÉES DE LA PROPRIÉTÉ :
- Type : ${propertyType}
- Adresse : ${address}
- Prix : ${price}
- Cible : ${targetProfile}
${roomCount ? `- Nombre de pièces : ${roomCount}` : ''}
${livingArea ? `- Surface habitable : ${livingArea}` : ''}
${constructionYear ? `- Année de construction : ${constructionYear}` : ''}
${keyPoints ? `- Points clés : ${keyPoints}` : ''}
${propertyDescription ? `- Description : ${propertyDescription}` : ''}

TÂCHE :
Crée un contenu marketing professionnel et attractif pour cette propriété, adapté aux ${targetProfile}.

INSTRUCTIONS :
1. Écris en français professionnel mais accessible
2. Mets en valeur les atouts de la propriété
3. Adapte le ton et les arguments à la cible spécifiée
4. Sois persuasif mais honnête
5. Utilise un style immobilier français moderne

RÉPONSE ATTENDUE (STRUCTURE EXACTE) :
[NARRATIVE]
[Écris ici une description narrative attractive de 150-200 mots pour le dossier PDF]

[SOCIAL_FACEBOOK]
[Post Facebook de 100-120 mots maximum avec émojis appropriés]

[SOCIAL_INSTAGRAM]
[Caption Instagram de 80-100 mots avec hashtags immobiliers français]

[SOCIAL_LINKEDIN]
[Post LinkedIn professionnel de 120-150 mots sans émojis]

Important : Respecte exactement cette structure avec les balises [NARRATIVE], [SOCIAL_FACEBOOK], [SOCIAL_INSTAGRAM], [SOCIAL_LINKEDIN].`;
}

/**
 * Parse the AI response into structured content
 * @param {string} response - Raw response from Claude
 * @returns {Object} Parsed content object
 */
function parseAIResponse(response) {
  try {
    const narrative = extractSection(response, 'NARRATIVE');
    const facebook = extractSection(response, 'SOCIAL_FACEBOOK');
    const instagram = extractSection(response, 'SOCIAL_INSTAGRAM');
    const linkedin = extractSection(response, 'SOCIAL_LINKEDIN');

    return {
      narrative: narrative || 'Contenu narratif non généré',
      socialMedia: {
        facebook: facebook || 'Post Facebook non généré',
        instagram: instagram || 'Post Instagram non généré', 
        linkedin: linkedin || 'Post LinkedIn non généré'
      },
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    
    // Fallback: return the raw response if parsing fails
    return {
      narrative: response,
      socialMedia: {
        facebook: 'Erreur de génération du contenu Facebook',
        instagram: 'Erreur de génération du contenu Instagram',
        linkedin: 'Erreur de génération du contenu LinkedIn'
      },
      generatedAt: new Date().toISOString(),
      parsingError: true
    };
  }
}

/**
 * Extract a specific section from the AI response
 * @param {string} text - Full AI response
 * @param {string} sectionName - Section to extract (without brackets)
 * @returns {string|null} Extracted section content
 */
function extractSection(text, sectionName) {
  const startPattern = `[${sectionName}]`;
  const startIndex = text.indexOf(startPattern);
  
  if (startIndex === -1) {
    return null;
  }
  
  // Find the start of content after the tag
  const contentStart = startIndex + startPattern.length;
  
  // Find the next section tag or end of text
  const nextSectionPattern = /\[SOCIAL_|NARRATIVE|LINKEDIN\]/;
  const remainingText = text.substring(contentStart);
  const nextMatch = remainingText.search(nextSectionPattern);
  
  let content;
  if (nextMatch === -1) {
    content = remainingText;
  } else {
    content = remainingText.substring(0, nextMatch);
  }
  
  return content.trim();
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Whether the API key format is valid
 */
export function validateApiKey(apiKey) {
  return apiKey && typeof apiKey === 'string' && apiKey.startsWith('sk-ant-');
}

/**
 * Test AI service connection
 * @returns {Promise<boolean>} Whether the service is accessible
 */
export async function testConnection() {
  const apiKey = process.env.CLAUDE_API_KEY;
  
  if (!validateApiKey(apiKey)) {
    return false;
  }
  
  try {
    // Simple test with minimal tokens
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ]
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('AI service connection test failed:', error);
    return false;
  }
}