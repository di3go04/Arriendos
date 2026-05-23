import crypto from 'crypto';
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';

/** Módulo 15 — firma electrónica con audit trail */
export interface SignatureAuditEntry {
  contractId: string;
  signerRole: 'landlord' | 'tenant';
  ip: string | null;
  userAgent: string | null;
  contentHash: string;
}

export function hashContractContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export async function recordSignature(entry: SignatureAuditEntry) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: 'Admin requerido' };

  const now = new Date().toISOString();
  const updates =
    entry.signerRole === 'landlord'
      ? { signed_by_landlord: true, landlord_signed_at: now }
      : { signed_by_tenant: true, tenant_signed_at: now };

  const { error: signErr } = await admin
    .from('contracts')
    .update(updates)
    .eq('id', entry.contractId);

  if (signErr) return { ok: false, error: signErr.message };

  const { error: auditErr } = await admin.from('contract_signature_audit').insert({
    contract_id: entry.contractId,
    signer_role: entry.signerRole,
    ip_address: entry.ip,
    user_agent: entry.userAgent,
    content_hash: entry.contentHash,
    signed_at: now,
  });
  if (auditErr) console.warn('[e-signature] audit log', auditErr.message);

  return { ok: true, signedAt: now, hash: entry.contentHash };
}
