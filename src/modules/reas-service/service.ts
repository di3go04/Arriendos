/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import Stripe from 'stripe';
import type { CreateReasSubscriptionInput, IReasService, ReasSubscription } from './contract';

function mapRow(row: any): ReasSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    planType: row.plan_type,
    status: row.status,
    pricePerMonth: Number(row.price_per_month),
    currency: row.currency || 'COP',
    startDate: row.start_date,
    endDate: row.end_date,
    minMonths: row.min_months || 1,
    pauseMonthsUsed: row.pause_months_used || 0,
    maxPauseMonths: row.max_pause_months || 3,
    nextBillingDate: row.next_billing_date,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createReasService(): IReasService {
  const admin = () => getSupabaseAdmin();

  return {
    async createSubscription(userId: string, input: CreateReasSubscriptionInput) {
      const db = admin();
      if (!db) return { ok: false, error: 'Admin no configurado' };

      const startDate = input.startDate || new Date().toISOString();
      const nextBilling = new Date(startDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const { data, error } = await db.from('reas_subscriptions').insert({
        user_id: userId,
        property_id: input.propertyId,
        unit_id: input.unitId || null,
        plan_type: input.planType,
        status: 'active',
        price_per_month: input.pricePerMonth,
        currency: input.currency || 'COP',
        start_date: startDate,
        end_date: input.endDate || null,
        min_months: input.minMonths || 1,
        pause_months_used: 0,
        max_pause_months: input.maxPauseMonths || 3,
        next_billing_date: nextBilling.toISOString(),
        stripe_price_id: input.stripePriceId || null,
        metadata: {},
      }).select().single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: mapRow(data) };
    },

    async pauseSubscription(subscriptionId: string, userId: string) {
      const db = admin();
      if (!db) return { ok: false, error: 'Admin no configurado' };

      const { data: sub } = await db.from('reas_subscriptions').select('*').eq('id', subscriptionId).eq('user_id', userId).single();
      if (!sub) return { ok: false, error: 'Suscripción no encontrada' };
      if (sub.pause_months_used >= sub.max_pause_months) {
        return { ok: false, error: 'Has agotado los meses de pausa disponibles' };
      }

      const nextBilling = new Date(sub.next_billing_date);
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const { data, error } = await db.from('reas_subscriptions').update({
        status: 'paused',
        pause_months_used: (sub.pause_months_used || 0) + 1,
        next_billing_date: nextBilling.toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', subscriptionId).select().single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: mapRow(data) };
    },

    async resumeSubscription(subscriptionId: string, userId: string) {
      const db = admin();
      if (!db) return { ok: false, error: 'Admin no configurado' };

      const { data, error } = await db.from('reas_subscriptions').update({
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', subscriptionId).eq('user_id', userId).eq('status', 'paused').select().single();

      if (error || !data) return { ok: false, error: error?.message || 'No se pudo reanudar' };
      return { ok: true, data: mapRow(data) };
    },

    async cancelSubscription(subscriptionId: string, userId: string) {
      const db = admin();
      if (!db) return { ok: false, error: 'Admin no configurado' };

      const { error } = await db.from('reas_subscriptions').update({
        status: 'cancelled',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', subscriptionId).eq('user_id', userId);

      return error ? { ok: false, error: error.message } : { ok: true };
    },

    async getSubscription(subscriptionId: string) {
      const db = admin();
      if (!db) return null;
      const { data } = await db.from('reas_subscriptions').select('*').eq('id', subscriptionId).maybeSingle();
      return data ? mapRow(data) : null;
    },

    async getUserSubscriptions(userId: string) {
      const db = admin();
      if (!db) return [];
      const { data } = await db.from('reas_subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (data || []).map(mapRow);
    },

    async processStripeWebhook(event: any) {
      const db = admin();
      if (!db) return;

      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          const periodEnd = new Date(invoice.lines?.data?.[0]?.period?.end * 1000 || Date.now());
          await db.from('reas_subscriptions').update({
            status: 'active',
            next_billing_date: periodEnd.toISOString(),
          }).eq('stripe_subscription_id', subId);
        }
      }

      if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          await db.from('reas_subscriptions').update({
            status: 'past_due',
          }).eq('stripe_subscription_id', subId);
        }
      }
    },
  };
}
