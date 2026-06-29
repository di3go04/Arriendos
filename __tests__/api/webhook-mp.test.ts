/**
 * @jest-environment node
 */

import { POST } from '../../src/app/api/payments/webhook-mp/route';

// Mock mercadopago lib
jest.mock('../../src/lib/mercadopago', () => ({
  mercadopagoClient: {},
  verifyWebhookSignature: jest.fn((_body: string, signature: string | null) => signature === 'valid-signature'),
}));

// Mock de Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({})),
      insert: jest.fn(() => Promise.resolve({})),
    })),
  })),
}));

describe('POST /api/payments/webhook-mp', () => {
  it('debe rechazar firma inválida cuando MP_WEBHOOK_SECRET está definido', async () => {
    process.env.MP_WEBHOOK_SECRET = 'test-secret';

    const req = new Request('http://localhost/api/payments/webhook-mp', {
      method: 'POST',
      headers: {
        'x-signature': 'invalid-signature',
        'x-request-id': '12345',
      },
      body: JSON.stringify({ type: 'payment', data: { id: '123' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Invalid signature');
  });

  it('debe procesar pago exitosamente con firma válida', async () => {
    process.env.MP_WEBHOOK_SECRET = 'test-secret';

    const req = new Request('http://localhost/api/payments/webhook-mp', {
      method: 'POST',
      headers: {
        'x-signature': 'valid-signature',
        'x-request-id': '12345',
      },
      body: JSON.stringify({
        type: 'payment',
        data: { id: 'PAY-123' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('received', true);
  });

  it('debe rechazar con 503 cuando MP_WEBHOOK_SECRET no está definido (fail-closed)', async () => {
    delete process.env.MP_WEBHOOK_SECRET;

    const req = new Request('http://localhost/api/payments/webhook-mp', {
      method: 'POST',
      headers: {
        'x-signature': '',
        'x-request-id': '12345',
      },
      body: JSON.stringify({
        type: 'payment',
        data: { id: 'PAY-456' },
      }),
    });

    const res = await POST(req);
    // Fail-closed: sin secret configurado, el webhook debe rechazar SIEMPRE
    // para evitar webhook spoofing si la env var se cae accidentalmente.
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Webhook secret not configured');
  });
});
