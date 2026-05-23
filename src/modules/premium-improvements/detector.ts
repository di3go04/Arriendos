import fs from 'fs';
import path from 'path';
import type { PremiumImprovementDefinition, PremiumImprovementId } from './registry';
import { PREMIUM_IMPROVEMENTS } from './registry';

export type ImprovementStatus = 'implemented' | 'partial' | 'pending';

export interface ImprovementStatusResult {
  id: PremiumImprovementId;
  status: ImprovementStatus;
  checks: { label: string; ok: boolean }[];
}

function fileExists(relativePath: string) {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function envReady(...keys: string[]) {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

function countJsonKeys(filePath: string): number {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const walk = (o: Record<string, unknown>): number =>
      Object.values(o).reduce<number>((n, v) => {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return n + walk(v as Record<string, unknown>);
        }
        return n + 1;
      }, 0);
    return walk(obj);
  } catch {
    return 0;
  }
}

const detectors: Record<PremiumImprovementId, () => ImprovementStatusResult> = {
  'payments-mp': () => {
    const checks = [
      { label: 'SDK / lib mercadopago', ok: fileExists('src/lib/mercadopago.ts') },
      { label: 'API create-preference', ok: fileExists('src/app/api/payments/create-preference/route.ts') },
      { label: 'Webhook MP firmado', ok: fileExists('src/app/api/payments/webhook-mp/route.ts') },
      {
        label: 'Credenciales MP configuradas',
        ok: envReady('MP_ACCESS_TOKEN') || envReady('MERCADOPAGO_ACCESS_TOKEN'),
      },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'payments-mp',
      checks,
      status: okCount >= 3 ? (okCount === 4 ? 'implemented' : 'partial') : 'pending',
    };
  },

  'subscriptions-saas': () => {
    const checks = [
      { label: 'Módulo subscriptions-saas', ok: fileExists('src/modules/subscriptions-saas/service.ts') },
      { label: 'API status', ok: fileExists('src/app/api/modules/subscriptions-saas/status/route.ts') },
      { label: 'API trial / cancel', ok: fileExists('src/app/api/modules/subscriptions-saas/trial/route.ts') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'subscriptions-saas',
      checks,
      status: okCount === 3 ? 'implemented' : okCount >= 2 ? 'partial' : 'pending',
    };
  },

  'i18n-trilingual': () => {
    const esKeys = countJsonKeys('src/messages/es.json');
    const enKeys = countJsonKeys('src/messages/en.json');
    const ptKeys = countJsonKeys('src/messages/pt.json');
    const checks = [
      { label: 'next-intl middleware', ok: fileExists('src/proxy.ts') },
      { label: 'es.json (≥150 claves)', ok: esKeys >= 150 },
      { label: 'en.json (≥150 claves)', ok: enKeys >= 150 },
      { label: 'pt.json (≥150 claves)', ok: ptKeys >= 150 },
      { label: 'LanguageSwitcher', ok: fileExists('src/components/shared/LanguageSwitcher.tsx') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'i18n-trilingual',
      checks,
      status: okCount >= 4 ? 'implemented' : okCount >= 2 ? 'partial' : 'pending',
    };
  },

  'e-signature': () => {
    const checks = [
      { label: 'Servicio e-signature', ok: fileExists('src/modules/e-signature/service.ts') },
      { label: 'API sign', ok: fileExists('src/app/api/modules/e-signature/sign/route.ts') },
      { label: 'Migración audit trail', ok: fileExists('supabase/migrations/10_e_signature_audit.sql') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'e-signature',
      checks,
      status: okCount >= 2 ? (okCount === 3 ? 'implemented' : 'partial') : 'pending',
    };
  },

  'ai-predictor': () => {
    const checks = [
      { label: 'Módulo ai-contracts', ok: fileExists('src/modules/ai-contracts/service.ts') },
      { label: 'API generate contrato', ok: fileExists('src/app/api/modules/ai-contracts/generate/route.ts') },
      { label: 'API predict morosity', ok: fileExists('src/app/api/ai/predict-morosity/route.ts') },
      { label: 'Gemini API key', ok: envReady('GEMINI_API_KEY') || envReady('GOOGLE_GENERATIVE_AI_API_KEY') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'ai-predictor',
      checks,
      status: okCount >= 3 ? (okCount === 4 ? 'implemented' : 'partial') : 'pending',
    };
  },

  'whatsapp-automation': () => {
    const checks = [
      { label: 'Servicio cola WhatsApp', ok: fileExists('src/modules/whatsapp-automation/service.ts') },
      { label: 'API enqueue', ok: fileExists('src/app/api/modules/whatsapp-automation/enqueue/route.ts') },
      { label: 'Migración cola', ok: fileExists('supabase/migrations/11_whatsapp_queue.sql') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'whatsapp-automation',
      checks,
      status: okCount >= 2 ? (okCount === 3 ? 'implemented' : 'partial') : 'pending',
    };
  },

  'finance-export': () => {
    const checks = [
      { label: 'Módulo finance-export', ok: fileExists('src/modules/finance-export/service.ts') },
      { label: 'API export-excel', ok: fileExists('src/app/api/reports/export-excel/route.ts') },
      { label: 'API reporte financiero', ok: fileExists('src/app/api/reports/financial/route.ts') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'finance-export',
      checks,
      status: okCount === 3 ? 'implemented' : okCount >= 1 ? 'partial' : 'pending',
    };
  },

  'auth-enterprise': () => {
    const checks = [
      { label: 'Módulo auth-enterprise', ok: fileExists('src/modules/auth-enterprise/service.ts') },
      { label: 'API MFA', ok: fileExists('src/app/api/modules/auth-enterprise/mfa/route.ts') },
      { label: 'API dispositivos', ok: fileExists('src/app/api/modules/auth-enterprise/devices/route.ts') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'auth-enterprise',
      checks,
      status: okCount === 3 ? 'implemented' : okCount >= 2 ? 'partial' : 'pending',
    };
  },

  'multi-tenant-whitelabel': () => {
    const checks = [
      { label: 'Módulo superadmin-tenant', ok: fileExists('src/modules/superadmin-tenant/service.ts') },
      { label: 'API organizations', ok: fileExists('src/app/api/modules/superadmin-tenant/organizations/route.ts') },
      { label: 'Admin organizations legacy', ok: fileExists('src/app/api/admin/organizations/route.ts') },
    ];
    const okCount = checks.filter((c) => c.ok).length;
    return {
      id: 'multi-tenant-whitelabel',
      checks,
      status: okCount >= 2 ? 'implemented' : 'partial',
    };
  },
};

export function detectAllImprovementStatuses(): ImprovementStatusResult[] {
  return PREMIUM_IMPROVEMENTS.map((def) => detectors[def.id]());
}

export function mergeStatusWithDefinitions(
  statuses: ImprovementStatusResult[]
): Array<PremiumImprovementDefinition & ImprovementStatusResult & { saleValueUnlockedUsd: number }> {
  return PREMIUM_IMPROVEMENTS.map((def) => {
    const st = statuses.find((s) => s.id === def.id)!;
    const saleValueUnlockedUsd =
      st.status === 'implemented'
        ? def.saleValueAddedUsd
        : st.status === 'partial'
          ? Math.round(def.saleValueAddedUsd * 0.4)
          : 0;
    return { ...def, ...st, saleValueUnlockedUsd };
  });
}
