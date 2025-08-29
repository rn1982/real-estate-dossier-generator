import { vi } from 'vitest';

export class Resend {
  constructor(apiKey) {
    // Don't throw error in tests even without API key
    this.apiKey = apiKey || 'test-key';
  }
  
  emails = {
    send: vi.fn().mockResolvedValue({
      data: { id: 'test-email-id' },
      error: null
    })
  };
}

export default Resend;