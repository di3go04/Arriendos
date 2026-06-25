import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { withDemoFallback, getDemoBelvoLink, getDemoSolvencyScore } from '@/lib/demo-fallbacks';
import type { BelvoAccount, BelvoTransaction, IOpenBankingService, SolvencyScore } from './contract';

const BELVO_API = process.env.BELVO_API_URL || 'https://api.belvo.com';
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID || '';
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD || '';
const BELVO_WEBHOOK_SECRET = process.env.BELVO_WEBHOOK_SECRET || '';

function basicAuth(): string {
  return Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');
}

async function belvoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BELVO_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Belvo API error ${res.status}: ${body}`);
  }
  return res.json();
}

export function createOpenBankingService(): IOpenBankingService {
  return {
    async createLink(userId: string) {
      return withDemoFallback(async () => {
        if (!BELVO_SECRET_ID || !BELVO_SECRET_PASSWORD) {
          return { ok: false, error: 'Belvo no configurado' };
        }
        try {
          const link = await belvoFetch<{ id: string; widget_url: string }>('/api/v1/links/', {
            method: 'POST',
            body: JSON.stringify({
              institution: 'erebor_ni',
              username: userId,
              access_mode: 'single',
              fetch_resources: ['accounts', 'transactions'],
            }),
          });
          const admin = getSupabaseAdmin();
          if (admin) {
            await admin.from('open_banking_links').upsert({
              user_id: userId,
              belvo_link_id: link.id,
              status: 'created',
              created_at: new Date().toISOString(),
            });
          }
          return { ok: true, data: { linkId: link.id, widgetUrl: link.widget_url } };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Error creando link Belvo' };
        }
      }, () => {
        const demo = getDemoBelvoLink(userId);
        return { ok: true, data: { linkId: demo.id, widgetUrl: demo.widget_url } };
      });
    },

    async processWebhook(payload: any) {
      if (payload?.event === 'link_status' && payload?.link) {
        const linkId = payload.link;
        const status = payload.status === 'success' ? 'connected' : 'error';
        const admin = getSupabaseAdmin();
        if (admin) {
          await admin.from('open_banking_links').update({ status }).eq('belvo_link_id', linkId);
        }
        return { ok: status === 'connected', linkId };
      }
      return { ok: false };
    },

    async evaluateSolvency(userId: string, linkId: string) {
      return withDemoFallback(async () => {
        try {
          const [accounts, transactions] = await Promise.all([
            belvoFetch<BelvoAccount[]>(`/api/v1/accounts/?link=${linkId}`),
            belvoFetch<BelvoTransaction[]>(`/api/v1/transactions/?link=${linkId}&page_size=100`),
          ]);

          const inflows = transactions.filter(t => t.type === 'INFLOW');
          const outflows = transactions.filter(t => t.type === 'OUTFLOW');

          const months = new Set(
            transactions.map(t => t.transaction_date?.slice(0, 7)).filter(Boolean)
          );
          const monthCount = Math.max(months.size, 1);

          const totalIncome = inflows.reduce((s, t) => s + Math.abs(t.amount), 0);
          const totalExpenses = outflows.reduce((s, t) => s + Math.abs(t.amount), 0);
          const avgMonthlyIncome = totalIncome / monthCount;
          const avgMonthlyExpenses = totalExpenses / monthCount;
          const debtToIncomeRatio = avgMonthlyIncome > 0 ? avgMonthlyExpenses / avgMonthlyIncome : 1;
          const maxRecommendedRent = avgMonthlyIncome * 0.35;

          let status: SolvencyScore['status'];
          let confidence = 0.85;
          if (avgMonthlyIncome < 100) {
            status = 'rejected';
            confidence = 0.7;
          } else if (debtToIncomeRatio > 0.8) {
            status = 'pending_review';
            confidence = 0.6;
          } else {
            status = 'approved';
            confidence = 0.9;
          }

          const score: SolvencyScore = {
            userId,
            status,
            averageMonthlyIncome: Math.round(avgMonthlyIncome),
            averageMonthlyExpenses: Math.round(avgMonthlyExpenses),
            debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
            maxRecommendedRent: Math.round(maxRecommendedRent),
            confidence,
            evaluatedAt: new Date().toISOString(),
            linkId,
          };

          const admin = getSupabaseAdmin();
          if (admin) {
            await admin.from('solvency_scores').upsert({
              user_id: userId,
              link_id: linkId,
              status: score.status,
              avg_monthly_income: score.averageMonthlyIncome,
              avg_monthly_expenses: score.averageMonthlyExpenses,
              debt_to_income_ratio: score.debtToIncomeRatio,
              max_recommended_rent: score.maxRecommendedRent,
              confidence: score.confidence,
              evaluated_at: score.evaluatedAt,
            });
          }

          return { ok: true, data: score };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Error evaluando solvencia' };
        }
      }, () => {
        const demo = getDemoSolvencyScore(userId);
        return { ok: true, data: demo as any };
      });
    },

    async getSolvencyStatus(userId: string) {
      const admin = getSupabaseAdmin();
      if (!admin) return null;
      const { data } = await admin
        .from('solvency_scores')
        .select('*')
        .eq('user_id', userId)
        .order('evaluated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      return {
        userId: data.user_id,
        status: data.status,
        averageMonthlyIncome: data.avg_monthly_income,
        averageMonthlyExpenses: data.avg_monthly_expenses,
        debtToIncomeRatio: data.debt_to_income_ratio,
        maxRecommendedRent: data.max_recommended_rent,
        confidence: data.confidence,
        evaluatedAt: data.evaluated_at,
        linkId: data.link_id,
      };
    },
  };
}
