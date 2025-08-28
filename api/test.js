// Simple test endpoint with no dependencies
export default function handler(req, res) {
  res.status(200).json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method
  })
}