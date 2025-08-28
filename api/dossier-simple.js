export default async function handler(req, res) {
  console.log('Simple dossier API called with method:', req.method);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }
  
  try {
    // For now, just return a success response without processing formidable
    // This helps us test if the API route itself works
    console.log('Processing request without formidable');
    
    res.status(201).json({
      message: 'Dossier reçu avec succès (simplifié)',
      timestamp: new Date().toISOString(),
      data: {
        agentEmail: 'test@example.com',
        propertyType: 'appartement',
        address: 'Test Address',
        price: '100000',
        targetBuyer: 'jeune_famille',
        photoCount: 0
      }
    });
  } catch (error) {
    console.error('Simple API error:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: error.message 
    });
  }
}