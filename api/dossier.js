import formidable from 'formidable';
import os from 'os';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('Dossier API called with method:', req.method);
  // Set CORS headers with origin validation
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
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
      if (parseError.httpCode) {
        res.status(parseError.httpCode).json({ error: parseError.message });
      } else {
        res.status(400).json({ error: 'Failed to parse form data' });
      }
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
        missingFields 
      });
      return;
    }

    // Extract form data with safe array access
    const getValue = (field) => {
      const value = fields[field];
      return Array.isArray(value) ? value[0] : value;
    };

    const formData = {
      agentEmail: getValue('agentEmail'),
      propertyType: getValue('propertyType'),
      address: getValue('address'),
      price: getValue('price'),
      targetBuyer: getValue('targetBuyer'),
      roomCount: getValue('roomCount') || null,
      livingArea: getValue('livingArea') || null,
      constructionYear: getValue('constructionYear') || null,
      keyPoints: getValue('keyPoints') || null,
      propertyDescription: getValue('propertyDescription') || null,
    };

    // Validate property type enum
    const validPropertyTypes = ['appartement', 'maison'];
    if (!validPropertyTypes.includes(formData.propertyType)) {
      res.status(400).json({ 
        error: 'Invalid property type',
        validTypes: validPropertyTypes 
      });
      return;
    }

    // Validate target buyer enum
    const validTargetBuyers = [
      'jeune_famille',
      'professionnel',
      'retraite',
      'investisseur',
      'premier_acheteur',
      'famille_multigenerationnelle'
    ];
    if (!validTargetBuyers.includes(formData.targetBuyer)) {
      res.status(400).json({ 
        error: 'Invalid target buyer',
        validTypes: validTargetBuyers 
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

    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Received dossier submission:', {
        timestamp: new Date().toISOString(),
        formData,
        photoCount: photoMetadata.length,
      });
    }

    // Return success response
    res.status(201).json({
      message: 'Dossier successfully received',
      timestamp: new Date().toISOString(),
      data: {
        ...formData,
        photoCount: photoMetadata.length,
      },
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