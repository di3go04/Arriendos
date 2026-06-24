import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { isDemoMode } from '@/lib/demo';
import { getDemoBelvoTransactions, getDemoReconciliationMatches } from '@/lib/demo-fallbacks';
import type { BankAccount, BankTransaction, IReconciliationService, ReconciliationMatch } from './contract';

const BELVO_API = process.env.BELVO_API_URL || 'https://api.belvo.com';
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID || '';
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD || '';

function basicAuth(): string {
  return Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

export function createReconciliationService(): IReconciliationService {
  const db = () => getSupabaseAdmin();

  return {
    async registerBankAccount(orgId, institution, accountNumber, accountName, belvoLinkId) {
      const admin = db();
      if (!admin) return { ok: false, error: 'Admin no configurado' };
      const { data, error } = await admin.from('bank_accounts').insert({
        organization_id: orgId,
        institution,
        account_number_last4: accountNumber.slice(-4),
        account_name: accountName,
        belvo_link_id: belvoLinkId,
        status: 'active',
      }).select().single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: data as any };
    },

    async syncTransactions(bankAccountId) {
      if (isDemoMode()) {
        const admin = db();
        if (admin) {
          const demo = getDemoBelvoTransactions('demo-link');
          const rows = demo.map((t) => ({
            bank_account_id: bankAccountId,
            external_id: t.id,
            amount: Math.abs(t.amount),
            description: t.description,
            transaction_date: t.transaction_date,
            type: t.type === 'INFLOW' ? 'credit' : 'debit',
          }));
          await admin.from('bank_transactions').upsert(rows, { onConflict: 'external_id,bank_account_id' });
          await admin.from('bank_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', bankAccountId);
          return { ok: true, synced: rows.length };
        }
        return { ok: true, synced: 10 };
      }

      const admin = db();
      if (!admin) return { ok: false, synced: 0 };

      const { data: account } = await admin.from('bank_accounts').select('*').eq('id', bankAccountId).single();
      if (!account?.belvo_link_id) return { ok: false, synced: 0 };

      if (!BELVO_SECRET_ID) {
        const { data: existing } = await admin.from('bank_transactions').select('id').eq('bank_account_id', bankAccountId);
        return { ok: true, synced: existing?.length || 0 };
      }

      try {
        const res = await fetch(`${BELVO_API}/api/v1/transactions/?link=${account.belvo_link_id}&page_size=100`, {
          headers: {
            Authorization: `Basic ${basicAuth()}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return { ok: false, synced: 0 };

        const transactions = await res.json();
        const rows = (transactions.results || transactions || []).map((t: any) => ({
          bank_account_id: bankAccountId,
          external_id: t.id,
          amount: Math.abs(t.amount),
          description: t.description || t.merchant?.name || '',
          transaction_date: t.transaction_date || t.collected_at,
          type: t.type === 'INFLOW' || t.amount > 0 ? 'credit' : 'debit',
          reference: t.reference || t.internal_identification || null,
        }));

        const { error } = await admin.from('bank_transactions').upsert(rows, { onConflict: 'external_id,bank_account_id' });
        await admin.from('bank_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', bankAccountId);

        return { ok: !error, synced: rows.length };
      } catch {
        return { ok: false, synced: 0 };
      }
    },

    async matchPayments(bankAccountId) {
      if (isDemoMode()) {
        const demo = getDemoReconciliationMatches();
        return demo as any;
      }

      const admin = db();
      if (!admin) return [];

      await this.syncTransactions(bankAccountId);

      const { data: account } = await admin.from('bank_accounts').select('organization_id').eq('id', bankAccountId).single();
      if (!account) return [];

      const { data: contracts } = await admin.from('contracts').select('id').eq('landlord_id', account.organization_id);
      const contractIds = (contracts || []).map(c => c.id);
      if (!contractIds.length) return [];

      const { data: payments } = await admin.from('payments').select('id, amount, due_date, paid, contract_id, paid_at').in('contract_id', contractIds).eq('paid', false);
      const { data: bankTxs } = await admin.from('bank_transactions').select('*').eq('bank_account_id', bankAccountId).eq('type', 'credit');

      const matches: ReconciliationMatch[] = [];

      for (const tx of (bankTxs || []) as any[]) {
        for (const pm of (payments || []) as any[]) {
          const amountDiff = Math.abs(Number(tx.amount) - Number(pm.amount));
          const dateDiff = daysBetween(tx.transaction_date, pm.due_date);

          if (amountDiff < 500 && dateDiff <= 5) {
            const confidence = Math.round((1 - amountDiff / Math.max(Number(pm.amount), 1)) * (1 - dateDiff / 10) * 100) / 100;
            const { data: match } = await admin.from('reconciliation_matches').insert({
              bank_transaction_id: tx.id,
              payment_id: pm.id,
              confidence: Math.max(confidence, 0.5),
              status: confidence > 0.85 ? 'confirmed' : 'pending',
            }).select().single();

            if (match && confidence > 0.85) {
              await admin.from('payments').update({ paid: true, paid_at: tx.transaction_date }).eq('id', pm.id);
            }

            if (match) matches.push(match as any);
          }
        }
      }

      return matches;
    },

    async confirmMatch(matchId) {
      const admin = db();
      if (!admin) return;
      const { data: match } = await admin.from('reconciliation_matches').update({ status: 'confirmed' }).eq('id', matchId).select().single();
      if (match) {
        await admin.from('payments').update({ paid: true, paid_at: new Date().toISOString() }).eq('id', match.payment_id);
      }
    },
  };
}
