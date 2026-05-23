import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { StripeRuntimeMode } from './config';

export interface SystemStripeConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string | null;
  siteUrl: string;
  stripePublishableKey: string | null;
  source: 'database' | 'env';
}

export interface SystemStripeConfigRow {
  id: number;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  next_public_site_url: string;
  stripe_publishable_key: string | null;
  updated_at: string;
  updated_by: string | null;
}

const SINGLETON_ID = 1;

function configFromEnv(): SystemStripeConfig | null {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!stripeSecretKey || !siteUrl) return null;

  return {
    stripeSecretKey,
    stripeWebhookSecret:
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET?.trim() ||
      null,
    siteUrl: siteUrl.replace(/\/$/, ''),
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null,
    source: 'env',
  };
}

/**
 * Lee credenciales Stripe: primero BD (configuracion_sistema), luego .env como respaldo dev.
 */
export async function loadSystemStripeConfig(): Promise<SystemStripeConfig | null> {
  const admin = getSupabaseAdmin();

  if (admin) {
    const { data, error } = await admin
      .from('configuracion_sistema')
      .select('*')
      .eq('id', SINGLETON_ID)
      .maybeSingle();

    if (!error && data?.stripe_secret_key?.trim() && data?.next_public_site_url?.trim()) {
      return {
        stripeSecretKey: data.stripe_secret_key.trim(),
        stripeWebhookSecret: data.stripe_webhook_secret?.trim() || null,
        siteUrl: data.next_public_site_url.trim().replace(/\/$/, ''),
        stripePublishableKey: data.stripe_publishable_key?.trim() || null,
        source: 'database',
      };
    }
  }

  return configFromEnv();
}

export async function isStripeConfiguredAsync(): Promise<boolean> {
  const cfg = await loadSystemStripeConfig();
  return Boolean(cfg?.stripeSecretKey);
}

export function getStripeRuntimeModeFromKey(secretKey: string): StripeRuntimeMode {
  if (secretKey.startsWith('sk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_')) return 'live';
  return 'unset';
}

export function maskSecret(value: string | null | undefined, visible = 4): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.length <= visible + 3) return '••••••••';
  return `${v.slice(0, 7)}…${v.slice(-visible)}`;
}

export async function getSystemConfigRowForAdmin(): Promise<{
  row: SystemStripeConfigRow | null;
  effective: SystemStripeConfig | null;
}> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { row: null, effective: configFromEnv() };
  }

  const { data: row } = await admin
    .from('configuracion_sistema')
    .select('*')
    .eq('id', SINGLETON_ID)
    .maybeSingle();

  const effective = await loadSystemStripeConfig();
  return { row: row as SystemStripeConfigRow | null, effective };
}

export async function upsertSystemStripeConfig(
  input: {
    stripe_secret_key: string;
    stripe_webhook_secret: string;
    next_public_site_url: string;
    stripe_publishable_key?: string | null;
  },
  updatedByUserId: string
) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY requerida para guardar configuración');
  }

  const { data, error } = await admin
    .from('configuracion_sistema')
    .upsert(
      {
        id: SINGLETON_ID,
        stripe_secret_key: input.stripe_secret_key.trim(),
        stripe_webhook_secret: input.stripe_webhook_secret.trim(),
        next_public_site_url: input.next_public_site_url.trim().replace(/\/$/, ''),
        stripe_publishable_key: input.stripe_publishable_key?.trim() || null,
        updated_at: new Date().toISOString(),
        updated_by: updatedByUserId,
      },
      { onConflict: 'id' }
    )
    .select('id, next_public_site_url, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return data;
}
