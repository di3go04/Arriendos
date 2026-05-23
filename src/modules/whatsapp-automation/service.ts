import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { sendWhatsAppViaBridge } from '@/lib/whatsapp';

const TEMPLATES: Record<string, (vars: Record<string, string>) => string> = {
  payment_reminder: (v) =>
    `Hola ${v.tenantName || 'arrendatario'}, recordatorio: canon de ${v.amount || ''} vence el ${v.dueDate || ''}. - RentNow`,
  payment_overdue: (v) =>
    `Hola ${v.tenantName || 'arrendatario'}, tu pago de ${v.amount || ''} está vencido desde ${v.dueDate || ''}. - RentNow`,
};

/** Módulo 17 — encola y procesa mensajes vía bridge Baileys */
export function createWhatsappAutomationService() {
  return {
    async enqueue(phone: string, templateKey: string, variables: Record<string, string>, userId?: string) {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin requerido' };

      const tpl = TEMPLATES[templateKey];
      if (!tpl) return { ok: false, error: 'Plantilla desconocida' };

      const body = tpl(variables);
      const { data, error } = await admin.from('whatsapp_message_queue').insert({
        phone,
        template_key: templateKey,
        body,
        user_id: userId ?? null,
      }).select('id').single();

      return error ? { ok: false, error: error.message } : { ok: true, queueId: data.id };
    },

    async processPending(limit = 10) {
      const admin = getSupabaseAdmin();
      if (!admin) return { processed: 0 };

      const { data: rows } = await admin
        .from('whatsapp_message_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      let processed = 0;
      for (const row of rows || []) {
        const result = await sendWhatsAppViaBridge(row.phone as string, row.body as string);
        await admin.from('whatsapp_message_queue').update({
          status: result.success ? 'sent' : 'failed',
          attempts: (row.attempts as number) + 1,
          last_error: result.success ? null : result.message,
          sent_at: result.success ? new Date().toISOString() : null,
        }).eq('id', row.id);
        if (result.success) processed += 1;
      }
      return { processed };
    },
  };
}
