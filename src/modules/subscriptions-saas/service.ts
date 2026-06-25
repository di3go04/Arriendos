import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { ISubscriptionsSaasService, SubscriptionPlanState } from './contract';

const DEFAULT_TRIAL_DAYS = 14;

export function createSubscriptionsSaasService(): ISubscriptionsSaasService {
  return {
    async startTrial(userId, planId, trialDays = DEFAULT_TRIAL_DAYS) {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialDays);

      const { error } = await admin.from('subscriptions').upsert({
        user_id: userId,
        plan_id: planId,
        status: 'trialing',
        trial_ends_at: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      }, { onConflict: 'user_id' });

      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async cancelAtPeriodEnd(userId) {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { error } = await admin
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('user_id', userId);

      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async getSubscription(userId) {
      const admin = getSupabaseAdmin();
      if (!admin) return null;

      const { data } = await admin
        .from('subscriptions')
        .select('plan_id, status, trial_ends_at, current_period_end')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data) return null;
      return {
        planId: data.plan_id as string,
        status: data.status as SubscriptionPlanState['status'],
        trialEndsAt: data.trial_ends_at as string | null,
        currentPeriodEnd: data.current_period_end as string | null,
      };
    },
  };
}
