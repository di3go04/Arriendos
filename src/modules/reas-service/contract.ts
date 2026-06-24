export type ReasPlanType = 'coliving_room' | 'flex_lease' | 'senior_living' | 'full_property';

export type ReasSubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due' | 'trialing';

export interface ReasSubscription {
  id: string;
  userId: string;
  propertyId: string;
  unitId?: string;
  planType: ReasPlanType;
  status: ReasSubscriptionStatus;
  pricePerMonth: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  minMonths: number;
  pauseMonthsUsed: number;
  maxPauseMonths: number;
  nextBillingDate: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReasSubscriptionInput {
  propertyId: string;
  unitId?: string;
  planType: ReasPlanType;
  pricePerMonth: number;
  currency?: string;
  minMonths?: number;
  maxPauseMonths?: number;
  startDate?: string;
  endDate?: string;
  stripePriceId?: string;
}

export interface IReasService {
  createSubscription(userId: string, input: CreateReasSubscriptionInput): Promise<{ ok: true; data: ReasSubscription } | { ok: false; error: string }>;
  pauseSubscription(subscriptionId: string, userId: string): Promise<{ ok: true; data: ReasSubscription } | { ok: false; error: string }>;
  resumeSubscription(subscriptionId: string, userId: string): Promise<{ ok: true; data: ReasSubscription } | { ok: false; error: string }>;
  cancelSubscription(subscriptionId: string, userId: string): Promise<{ ok: boolean; error?: string }>;
  getSubscription(subscriptionId: string): Promise<ReasSubscription | null>;
  getUserSubscriptions(userId: string): Promise<ReasSubscription[]>;
  processStripeWebhook(event: any): Promise<void>;
}
