import { withSentry, Sentry } from './sentryConfig.js';

async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only available in development mode
  if (process.env.NODE_ENV === 'production' && !req.query.force) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const errorType = req.query.type || 'error';

  try {
    switch (errorType) {
      case 'error':
        // Throw a test error
        throw new Error('Test error from backend API - This is a test error for Sentry');
      
      case 'warning':
        // Send a warning message
        if (Sentry) {
          Sentry.captureMessage('Test warning from backend API', 'warning');
        }
        res.status(200).json({ 
          message: 'Test warning sent to Sentry',
          type: 'warning'
        });
        break;
      
      case 'info':
        // Send an info message
        if (Sentry) {
          Sentry.captureMessage('Test info from backend API', 'info');
        }
        res.status(200).json({ 
          message: 'Test info sent to Sentry',
          type: 'info'
        });
        break;
      
      case 'custom': {
        // Custom error with context
        const customError = new Error('Custom test error with additional context');
        if (Sentry) {
          Sentry.captureException(customError, {
            extra: {
              testType: 'custom',
              timestamp: new Date().toISOString(),
              environment: process.env.NODE_ENV,
              apiVersion: '1.0.0'
            },
            tags: {
              test: true,
              endpoint: 'test-error'
            }
          });
        }
        throw customError;
      }
      
      default:
        res.status(400).json({ 
          error: 'Invalid error type',
          validTypes: ['error', 'warning', 'info', 'custom']
        });
    }
  } catch (error) {
    // The error will be captured by the withSentry wrapper
    console.error('Test error endpoint:', error.message);
    
    res.status(500).json({ 
      error: 'Test error triggered successfully',
      message: error.message,
      sentToSentry: true
    });
  }
}

export default withSentry(handler);