// Health check endpoint
export default function handler(req, res) {
  try {
    // Set CORS headers safely
    if (res.setHeader) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    }

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }

    // Return health check response
    return res.status(200).json({
      status: 'ok',
      message: 'Health check passed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '0.1.0'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}