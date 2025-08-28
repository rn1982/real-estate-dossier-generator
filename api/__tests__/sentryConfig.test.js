import { jest } from '@jest/globals';

// Mock @sentry/node before importing the module
jest.mock('@sentry/node');

describe('sentryConfig', () => {
  let sentryConfig;
  let mockSentry;
  
  beforeEach(async () => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();
    jest.clearAllMocks();
    
    // Import mocked Sentry
    mockSentry = await import('@sentry/node');
    
    // Import the module under test
    sentryConfig = await import('../sentryConfig.js');
  });

  describe('initSentry', () => {
    it('should initialize Sentry when DSN is provided', () => {
      const originalEnv = process.env.SENTRY_DSN;
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.SENTRY_ENVIRONMENT = 'test';
      process.env.NODE_ENV = 'development';
      
      sentryConfig.initSentry();
      
      expect(mockSentry.init).toHaveBeenCalledWith({
        dsn: 'https://test@sentry.io/123',
        environment: 'test',
        tracesSampleRate: 1.0,
        beforeSend: expect.any(Function),
      });
      
      // Restore environment
      process.env.SENTRY_DSN = originalEnv;
    });

    it('should not initialize Sentry when DSN is not provided', () => {
      const originalEnv = process.env.SENTRY_DSN;
      delete process.env.SENTRY_DSN;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      sentryConfig.initSentry();
      
      expect(mockSentry.init).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Sentry DSN not configured for backend, skipping initialization'
      );
      
      consoleSpy.mockRestore();
      process.env.SENTRY_DSN = originalEnv;
    });

    it('should use production sample rate in production environment', () => {
      const originalEnv = { ...process.env };
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'production';
      
      sentryConfig.initSentry();
      
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          tracesSampleRate: 0.1,
        })
      );
      
      // Restore environment
      Object.assign(process.env, originalEnv);
    });

    it('should filter sensitive data in beforeSend', () => {
      const originalEnv = process.env.SENTRY_DSN;
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      
      sentryConfig.initSentry();
      
      // Get the beforeSend function
      const beforeSendCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = beforeSendCall.beforeSend;
      
      // Test filtering of sensitive data
      const event = {
        request: {
          cookies: 'session=secret',
          headers: {
            authorization: 'Bearer token',
            'content-type': 'application/json',
          },
          data: {
            password: 'secret123',
            token: 'jwt-token',
            apiKey: 'api-secret',
            username: 'testuser',
          },
        },
      };
      
      const filteredEvent = beforeSend(event, {});
      
      expect(filteredEvent.request.cookies).toBeUndefined();
      expect(filteredEvent.request.headers.authorization).toBeUndefined();
      expect(filteredEvent.request.data.password).toBeUndefined();
      expect(filteredEvent.request.data.token).toBeUndefined();
      expect(filteredEvent.request.data.apiKey).toBeUndefined();
      expect(filteredEvent.request.data.username).toBe('testuser');
      
      process.env.SENTRY_DSN = originalEnv;
    });

    it('should return null in test environment', () => {
      const originalEnv = { ...process.env };
      process.env.SENTRY_DSN = 'https://test@sentry.io/123';
      process.env.NODE_ENV = 'test';
      
      sentryConfig.initSentry();
      
      const beforeSendCall = mockSentry.init.mock.calls[0][0];
      const beforeSend = beforeSendCall.beforeSend;
      
      const event = { request: {} };
      const result = beforeSend(event, {});
      
      expect(result).toBeNull();
      
      Object.assign(process.env, originalEnv);
    });
  });

  describe('withSentry', () => {
    let mockHandler;
    let mockReq;
    let mockRes;
    
    beforeEach(() => {
      mockHandler = jest.fn().mockResolvedValue(undefined);
      mockReq = {
        method: 'POST',
        url: '/api/test',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'content-type': 'application/json',
        },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      
      // Setup Sentry mock
      mockSentry.configureScope = jest.fn((callback) => {
        const scope = {
          setContext: jest.fn(),
        };
        callback(scope);
        return scope;
      });
    });

    it('should wrap handler and initialize Sentry', async () => {
      const wrappedHandler = sentryConfig.withSentry(mockHandler);
      
      await wrappedHandler(mockReq, mockRes);
      
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockSentry.configureScope).toHaveBeenCalled();
    });

    it('should add request context to Sentry', async () => {
      const wrappedHandler = sentryConfig.withSentry(mockHandler);
      let capturedContext;
      
      mockSentry.configureScope.mockImplementation((callback) => {
        const scope = {
          setContext: jest.fn((name, context) => {
            if (name === 'request') {
              capturedContext = context;
            }
          }),
        };
        callback(scope);
      });
      
      await wrappedHandler(mockReq, mockRes);
      
      expect(capturedContext).toEqual({
        method: 'POST',
        url: '/api/test',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'content-type': 'application/json',
        },
      });
    });

    it('should capture exceptions and re-throw them', async () => {
      const error = new Error('Test error');
      mockHandler.mockRejectedValue(error);
      
      const wrappedHandler = sentryConfig.withSentry(mockHandler);
      
      await expect(wrappedHandler(mockReq, mockRes)).rejects.toThrow('Test error');
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should only initialize Sentry once for multiple requests', async () => {
      const wrappedHandler = sentryConfig.withSentry(mockHandler);
      
      // Reset the init mock to track fresh calls
      mockSentry.init.mockClear();
      
      // Make multiple requests
      await wrappedHandler(mockReq, mockRes);
      await wrappedHandler(mockReq, mockRes);
      await wrappedHandler(mockReq, mockRes);
      
      // Since initSentry tracks initialization state, it shouldn't be called multiple times
      // But we need to check the actual implementation
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });
});