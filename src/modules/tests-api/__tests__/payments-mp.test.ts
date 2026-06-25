import { createPaymentsMpService } from '@/modules/payments-mp';

describe('payments-mp module', () => {
  it('expone configuración pública', () => {
    const svc = createPaymentsMpService();
    const cfg = svc.getPublicConfig();
    expect(cfg).toHaveProperty('mode');
    expect(cfg).toHaveProperty('configured');
  });
});
