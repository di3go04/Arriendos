import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import crypto from 'crypto';

export interface OrgLimits {
  maxProperties: number;
  maxUsers: number;
  plan: string;
}

export function createSuperadminTenantService() {
  return {
    async listOrganizations() {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin requerido' };
      const { data, error } = await admin.from('organizations').select('*').order('created_at', { ascending: false });
      return error ? { ok: false, error: error.message } : { ok: true, data };
    },

    async updateOrgLimits(orgId: string, limits: OrgLimits) {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin requerido' };
      const { error } = await admin.from('organizations').update({
        max_properties: limits.maxProperties,
        max_users: limits.maxUsers,
        plan: limits.plan,
      }).eq('id', orgId);
      return error ? { ok: false, error: error.message } : { ok: true };
    },

    /** Token de impersonación de un solo uso (5 min) — solo superadmin */
    async createImpersonationToken(adminUserId: string, targetUserId: string) {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin requerido' };

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: impErr } = await admin.from('admin_impersonation_tokens').insert({
        token,
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        expires_at: expires,
        used: false,
      });
      if (impErr) console.warn('[superadmin] impersonation table', impErr.message);

      return { ok: true, token, expiresAt: expires };
    },

    async globalMetrics() {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin requerido' };

      const [props, contracts, leads] = await Promise.all([
        admin.from('properties').select('id', { count: 'exact', head: true }),
        admin.from('contracts').select('id', { count: 'exact', head: true }),
        admin.from('property_leads').select('id', { count: 'exact', head: true }),
      ]);

      return {
        ok: true,
        data: {
          properties: props.count ?? 0,
          contracts: contracts.count ?? 0,
          leads: leads.count ?? 0,
        },
      };
    },
  };
}
