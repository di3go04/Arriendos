import { verifyWebhookSignature } from '@/lib/mercadopago';

describe('mercadopago', () => {
  describe('verifyWebhookSignature', () => {
    it('returns false when signature is missing', () => {
      expect(verifyWebhookSignature('{}', null, null)).toBe(false);
    });

    it('returns false when x-request-id is missing', () => {
      expect(verifyWebhookSignature('{}', 'ts=12345678,v1=hash', null)).toBe(false);
    });

    it('returns false when signature format is invalid', () => {
      expect(verifyWebhookSignature('{}', 'invalid-format', 'req-123')).toBe(false);
    });

    it('returns false with empty secret', () => {
      const result = verifyWebhookSignature('{}', 'ts=123456,v1=abc', 'req-1');
      expect(result).toBe(false);
    });
  });
});
