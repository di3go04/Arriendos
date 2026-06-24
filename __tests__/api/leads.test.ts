/**
 * @jest-environment node
 */

import { POST } from '../../src/app/api/leads/route';

describe('POST /api/leads', () => {
  it('debe rechazar request sin datos requeridos', async () => {
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('debe aceptar lead válido', async () => {
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '1234567890',
        propertyId: 'prop-123',
        message: 'Interesado en la propiedad',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('leadId');
  });

  it('debe rechazar email inválido', async () => {
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Juan Pérez',
        email: 'email-invalido',
        phone: '1234567890',
        propertyId: 'prop-123',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
