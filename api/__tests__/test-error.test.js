import { jest } from '@jest/globals';

// Mock @sentry/node
jest.mock('@sentry/node');

// Mock sentryConfig
jest.mock('../sentryConfig.js', () => ({
  withSentry: jest.fn((handler) => handler),
  Sentry: {
    captureMessage: jest.fn(),
    captureException: jest.fn(),
  },
}));

describe('test-error API endpoint', () => {
  let handler;
  let mockSentryConfig;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import the mocked sentryConfig
    mockSentryConfig = await import('../sentryConfig.js');
    
    // Import the handler
    const module = await import('../test-error.js');
    handler = module.default;

    // Create mock request and response objects
    mockReq = {
      method: 'GET',
      query: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
  });

  describe('CORS handling', () => {
    it('should set CORS headers', async () => {
      await handler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        expect.any(String)
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type'
      );
    });

    it('should handle OPTIONS request for preflight', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('Environment protection', () => {
    it('should return 404 in production without force flag', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Not found' });

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow access in production with force flag', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      mockReq.query.force = 'true';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error triggered successfully',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should allow access in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Test error triggered successfully',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error type handling', () => {
    it('should trigger default error type', async () => {
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Test error triggered successfully',
        message: 'Test error from backend API - This is a test error for Sentry',
        sentToSentry: true,
      });
    });

    it('should handle warning type', async () => {
      mockReq.query.type = 'warning';

      await handler(mockReq, mockRes);

      expect(mockSentryConfig.Sentry.captureMessage).toHaveBeenCalledWith(
        'Test warning from backend API',
        'warning'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Test warning sent to Sentry',
        type: 'warning',
      });
    });

    it('should handle info type', async () => {
      mockReq.query.type = 'info';

      await handler(mockReq, mockRes);

      expect(mockSentryConfig.Sentry.captureMessage).toHaveBeenCalledWith(
        'Test info from backend API',
        'info'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Test info sent to Sentry',
        type: 'info',
      });
    });

    it('should handle custom error type with context', async () => {
      mockReq.query.type = 'custom';

      await handler(mockReq, mockRes);

      expect(mockSentryConfig.Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            testType: 'custom',
            timestamp: expect.any(String),
            environment: expect.any(String),
            apiVersion: '1.0.0',
          }),
          tags: expect.objectContaining({
            test: true,
            endpoint: 'test-error',
          }),
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Test error triggered successfully',
        message: 'Custom test error with additional context',
        sentToSentry: true,
      });
    });

    it('should handle invalid error type', async () => {
      mockReq.query.type = 'invalid';

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid error type',
        validTypes: ['error', 'warning', 'info', 'custom'],
      });
    });
  });

  describe('withSentry wrapper integration', () => {
    it('should be wrapped with withSentry', async () => {
      // The handler should be wrapped with withSentry
      expect(mockSentryConfig.withSentry).toHaveBeenCalled();
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await handler(mockReq, mockRes);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Test error endpoint:',
        'Test error from backend API - This is a test error for Sentry'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Sentry integration', () => {
    it('should not send to Sentry when Sentry is not available', async () => {
      // Temporarily set Sentry to null
      const originalSentry = mockSentryConfig.Sentry;
      mockSentryConfig.Sentry = null;

      mockReq.query.type = 'warning';
      await handler(mockReq, mockRes);

      // Should still respond successfully
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Test warning sent to Sentry',
        type: 'warning',
      });

      // Restore Sentry
      mockSentryConfig.Sentry = originalSentry;
    });

    it('should capture error details correctly', async () => {
      const testError = new Error('Test error from backend API - This is a test error for Sentry');
      
      await handler(mockReq, mockRes);

      // Check that the error message is correct
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Test error triggered successfully',
        message: testError.message,
        sentToSentry: true,
      });
    });
  });
});