import { useState } from 'react';
import { captureException, captureMessage } from '@/config/sentry';

export function TestErrorButton() {
  const [testType, setTestType] = useState('error');

  // Only show in development mode
  if (import.meta.env.VITE_APP_ENV !== 'development') {
    return null;
  }

  const triggerTestError = () => {
    switch (testType) {
      case 'error':
        // Trigger a JavaScript error
        try {
          throw new Error('Test error from frontend - This is a test error for Sentry');
        } catch (error) {
          console.error('Test error triggered:', error);
          captureException(error);
          alert('Test error sent to Sentry!');
        }
        break;
      
      case 'unhandled':
        // Trigger an unhandled error (will be caught by error boundary)
        setTimeout(() => {
          throw new Error('Unhandled test error - This should be caught by error boundary');
        }, 0);
        break;
      
      case 'message':
        // Send a test message
        captureMessage('Test message from frontend', 'warning');
        alert('Test message sent to Sentry!');
        break;
      
      case 'api':
        // Trigger API error
        fetch('/api/test-error')
          .then(res => {
            if (!res.ok) {
              alert('API test error triggered!');
            }
          })
          .catch(error => {
            console.error('API test error:', error);
            captureException(error);
          });
        break;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-red-500 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-bold text-red-600 mb-2">
        Sentry Test (Dev Only)
      </h3>
      <select
        value={testType}
        onChange={(e) => setTestType(e.target.value)}
        className="w-full mb-2 px-2 py-1 border rounded text-sm"
      >
        <option value="error">Handled Error</option>
        <option value="unhandled">Unhandled Error</option>
        <option value="message">Test Message</option>
        <option value="api">API Error</option>
      </select>
      <button
        onClick={triggerTestError}
        className="w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
      >
        Trigger Test
      </button>
    </div>
  );
}