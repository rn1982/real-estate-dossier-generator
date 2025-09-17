import formidable from 'formidable';
import os from 'os';
import path from 'path';
import { sendConfirmationEmail, validateEmail } from './emailService.js';
import { generateAIContent } from './aiServiceGemini.js';

// Rate limiting is now handled in aiServiceGemini.js

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  console.log('Dossier API called with method:', req.method);
  // Set CORS headers with origin validation driven by environment configuration
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Get client IP for rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

  try {
    // Configure formidable with proper temp directory for Vercel
    const form = formidable({
      multiples: true,
      maxFiles: 20,
      maxFileSize: 10 * 1024 * 1024, // 10MB per file
      uploadDir: path.join(os.tmpdir(), 'uploads'), // Use OS temp directory
      keepExtensions: true,
      allowEmptyFiles: false,
      filter: function ({ mimetype }) {
        // Accept only image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return allowedTypes.includes(mimetype);
      },
    });

    // Parse the form with better error handling
    let fields, files;
    try {
      [fields, files] = await form.parse(req);
    } catch (parseError) {
      console.error('Form parsing error:', parseError);
      if (parseError.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File size exceeds maximum allowed (10MB)' });
        return;
      }
      if (parseError.code === 'LIMIT_FILE_COUNT') {
        res.status(413).json({ error: 'Too many files. Maximum 20 files allowed.' });
        return;
      }
      if (parseError.code === 'LIMIT_UNEXPECTED_FILE') {
        res.status(400).json({ error: 'Unexpected file field' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Extract and validate required fields
    const requiredFields = ['agentEmail', 'propertyType', 'address', 'price', 'targetBuyer'];
    const missingFields = [];

    for (const field of requiredFields) {
      // Check if field exists and has value (formidable v3 returns arrays)
      const fieldValue = fields[field];
      if (!fieldValue || (Array.isArray(fieldValue) && !fieldValue[0])) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missingFields,
      });
      return;
    }

    // Extract form data with safe array access
    const getValue = (field) => {
      const value = fields[field];
      return Array.isArray(value) ? value[0] : value;
    };

    const optionalValue = (field) => {
      const value = getValue(field);
      return value === undefined || value === '' ? null : value;
    };

    const formData = {
      agentEmail: getValue('agentEmail'),
      propertyType: getValue('propertyType'),
      propertyAddress: getValue('address'),
      propertyLocation: getValue('propertyLocation') || getValue('address'),
      price: getValue('price'),
      targetBuyer: getValue('targetBuyer'),
      roomCount: optionalValue('roomCount'),
      bedroomCount: optionalValue('bedroomCount'),
      bathroomCount: optionalValue('bathroomCount'),
      livingArea: optionalValue('livingArea'),
      landArea: optionalValue('landArea'),
      yearBuilt: optionalValue('constructionYear'),
      hasGarage: getValue('hasGarage') === 'true',
      hasGarden: getValue('hasGarden') === 'true',
      hasPool: getValue('hasPool') === 'true',
      hasBalcony: getValue('hasBalcony') === 'true',
      heatingType: optionalValue('heatingType'),
      energyClass: optionalValue('energyClass'),
      ghgClass: optionalValue('ghgClass'),
      features: getValue('features') ? getValue('features').split(',').map(f => f.trim()) : [],
      keyPoints: optionalValue('keyPoints'),
      propertyDescription: optionalValue('propertyDescription'),
    };

    const validPropertyTypes = ['appartement', 'maison'];
    if (!validPropertyTypes.includes(formData.propertyType)) {
      res.status(400).json({
        error: 'Invalid property type',
        validTypes: validPropertyTypes,
      });
      return;
    }

    const validTargetBuyers = [
      'jeune_famille',
      'professionnel',
      'investisseur',
      'retraite',
      'premier_acheteur',
      'famille_multigenerationnelle',
    ];
    if (!validTargetBuyers.includes(formData.targetBuyer)) {
      res.status(400).json({
        error: 'Invalid target buyer',
        validTypes: validTargetBuyers,
      });
      return;
    }

    // Process file metadata
    const photoMetadata = [];
    if (files.photos) {
      const photoFiles = Array.isArray(files.photos) ? files.photos : [files.photos];
      for (const file of photoFiles) {
        // Validate file mimetype again for security
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          res.status(415).json({
            error: 'Unsupported media type',
            file: file.originalFilename,
            allowedTypes 
          });
          return;
        }

        photoMetadata.push({
          filename: file.originalFilename,
          size: file.size,
          mimetype: file.mimetype,
        });
      }
    }

    // Validate email format
    if (!validateEmail(formData.agentEmail)) {
      res.status(400).json({
        error: 'Invalid email format',
        email: formData.agentEmail,
      });
      return;
    }

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Received dossier submission:', {
        timestamp: new Date().toISOString(),
        formData,
        photoCount: photoMetadata.length,
      });
    }

    // Generate AI content for Epic 2 (Story 2.1)
    let aiContent = null;
    let aiGenerationError = null;
    
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Generating AI content for property...');
        const aiResult = await generateAIContent(formData, clientIp);
        aiContent = {
          narrative: aiResult.narrative,
          socialMedia: {
            facebook: aiResult.facebook,
            instagram: aiResult.instagram,
            linkedin: aiResult.linkedin
          },
          generatedAt: new Date().toISOString(),
          cached: aiResult.cached,
          generationTime: aiResult.generationTime,
          rateLimit: aiResult.rateLimit
        };
        console.log('AI content generated successfully', {
          cached: aiResult.cached,
          generationTime: aiResult.generationTime
        });
      } catch (error) {
        console.error('AI content generation failed:', error);
        aiGenerationError = error.message;
        
        // Handle rate limit error
        if (error.status === 429) {
          res.status(429).json({ 
            error: 'Trop de demandes d\'IA. Veuillez réessayer plus tard.',
            retryAfter: error.retryAfter || 3600
          });
          return;
        }
        // Continue with the process even if AI fails
      }
    } else {
      console.log('Gemini API key not configured, skipping AI content generation');
    }

    // Send confirmation email (now includes AI content if available)
    const emailResult = await sendConfirmationEmail(formData, photoMetadata.length, aiContent);
    
    if (!emailResult.success) {
      // Log email error but don't fail the request
      console.error('Failed to send confirmation email:', emailResult.error);
      // Continue with the response even if email fails
    } else {
      console.log('Confirmation email sent successfully to:', formData.agentEmail);
    }

    // Return success response
    res.status(201).json({
      message: 'Dossier successfully received',
      timestamp: new Date().toISOString(),
      data: {
        agentEmail: formData.agentEmail,
        propertyType: formData.propertyType,
        address: formData.propertyAddress,
        price: formData.price,
        targetBuyer: formData.targetBuyer,
        photoCount: photoMetadata.length,
        roomCount: formData.roomCount,
        livingArea: formData.livingArea,
        constructionYear: formData.yearBuilt,
        keyPoints: formData.keyPoints,
        propertyDescription: formData.propertyDescription,
      },
      aiContent,
      emailSent: emailResult.success,
      aiGenerationError
    });

  } catch (error) {
    // Enhanced error logging with context
    const errorContext = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
    
    console.error('[API Error] Dossier endpoint:', errorContext);
    
    // Error logging (Sentry removed for production compatibility)

    // Handle specific formidable errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File size exceeds maximum allowed (10MB)' });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(413).json({ error: 'Too many files. Maximum 20 files allowed.' });
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Unexpected file field' });
      return;
    }

    // Generic error response with more details in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Internal server error: ${error.message}`
      : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
}

export default handler;
