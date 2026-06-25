export interface SubscriptionPlanState {
  planId: string;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface ISubscriptionsSaasService {
  startTrial(userId: string, planId: string, trialDays?: number): Promise<{ ok: boolean; error?: string }>;
  cancelAtPeriodEnd(userId: string): Promise<{ ok: boolean; error?: string }>;
  getSubscription(userId: string): Promise<SubscriptionPlanState | null>;
}
