import { createSubscriptionsSaasService } from '@/modules/subscriptions-saas';

describe('subscriptions-saas', () => {
  it('expone métodos de trial y cancel', () => {
    const svc = createSubscriptionsSaasService();
    expect(typeof svc.startTrial).toBe('function');
    expect(typeof svc.cancelAtPeriodEnd).toBe('function');
    expect(typeof svc.getSubscription).toBe('function');
  });
});
