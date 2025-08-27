export default async function handler(req, res) {
  console.log('Test dossier API called');
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    res.status(200).json({ 
      status: 'ok',
      message: 'Test endpoint is working',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.method === 'POST') {
    try {
      // Simple echo without formidable
      res.status(201).json({ 
        message: 'Test submission received',
        timestamp: new Date().toISOString(),
        data: {
          method: req.method,
          headers: req.headers,
          url: req.url
        }
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      res.status(500).json({ 
        error: 'Test endpoint error',
        details: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}