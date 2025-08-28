import * as Sentry from '@sentry/node';

let isInitialized = false;

function initSentry() {
  if (isInitialized) return;
  
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('Sentry DSN not configured for backend, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, _hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
        
        // Sanitize form data
        if (event.request.data) {
          const sanitized = { ...event.request.data };
          // Remove any sensitive fields
          delete sanitized.password;
          delete sanitized.token;
          delete sanitized.apiKey;
          event.request.data = sanitized;
        }
      }
      
      // Don't send events in test environment
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      
      return event;
    },
  });

  isInitialized = true;
}

function withSentry(handler) {
  return async (req, res) => {
    initSentry();
    
    try {
      // Add request context to Sentry
      Sentry.configureScope((scope) => {
        scope.setContext('request', {
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
          },
        });
      });
      
      return await handler(req, res);
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error);
      
      // Re-throw to let the API handler deal with the response
      throw error;
    }
  };
}

export { initSentry, withSentry, Sentry };