// Follow Supabase Edge Functions standard Deno structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client with Admin/Service Role Privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials in Edge Function environment.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch all landlord profiles to loop reminders
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, preferred_currency');

    if (profileErr) throw profileErr;

    const summaryLog = [];

    // 3. For each landlord, check active billing cycles
    for (const landlord of profiles || []) {
      // Find active payments that are due soon (next 3 days) or already overdue
      const { data: payments, error: payErr } = await supabase
        .from('payments')
        .select(`
          id,
          due_date,
          amount,
          status,
          user_id,
          lease:leases (
            id,
            payment_frequency,
            monthly_rent,
            property:properties (name, address),
            tenant:tenants (full_name, email)
          )
        `)
        .eq('user_id', landlord.id)
        .or('status.eq.pending,status.eq.overdue');

      if (payErr) {
        console.error(`Error querying payments for landlord ${landlord.id}:`, payErr);
        continue;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const p of payments || []) {
        const tenant = p.lease?.tenant;
        const property = p.lease?.property;
        if (!tenant || !property) continue;

        const dueDate = new Date(p.due_date);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let shouldSend = false;
        let isOverdue = false;

        // Auto Remind Rule: 3 days before OR exactly overdue (every 3 days of delay)
        if (diffDays === 3 && p.status === 'pending') {
          shouldSend = true;
        } else if (diffDays < 0 && p.status !== 'paid') {
          shouldSend = Math.abs(diffDays) % 3 === 0; // Remind every 3 days of delay
          isOverdue = true;
        }

        if (shouldSend) {
          // Dynamic Email compiler helper
          const currencySymbol = landlord.preferred_currency === 'COP' ? 'COP $' : '$';
          const rentFormatted = `${currencySymbol}${Number(p.amount).toLocaleString()}`;
          const formattedDueDate = p.due_date;

          let subject = "";
          let body = "";

          if (isOverdue) {
            subject = `⚠️ ALERTA: Cobro Vencido de Alquiler - ${property.name}`;
            body = `Estimado ${tenant.full_name},\n\nTe informamos que tu pago de alquiler de ${rentFormatted} para la propiedad ${property.name} (${property.address}) se encuentra VENCIDO desde el ${formattedDueDate}.\n\nPor favor realiza el pago a la brevedad para evitar recargos o penalizaciones.\n\nAtentamente,\n${landlord.full_name}`;
          } else {
            subject = `⏳ Recordatorio de Pago de Alquiler - ${property.name}`;
            body = `Hola ${tenant.full_name},\n\nTe recordamos que el canon de arrendamiento correspondiente al inmueble ${property.name} por valor de ${rentFormatted} tiene vencimiento el próximo ${formattedDueDate}.\n\nAgradecemos realizar tu transferencia a tiempo.\n\nSaludos,\n${landlord.full_name}`;
          }

          // In production: Connect to Resend API / SendGrid or Deno SMTP
          // Example:
          // await fetch('https://api.resend.com/emails', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
          //   },
          //   body: JSON.stringify({
          //     from: 'Arrendo Reminders <alerts@arrendo.co>',
          //     to: [tenant.email],
          //     subject: subject,
          //     text: body
          //   })
          // });

          // Log in database notifications_log
          await supabase.from('notifications_log').insert({
            user_id: landlord.id,
            tenant_id: p.lease.tenant_id || null,
            notification_type: isOverdue ? 'overdue_reminder' : 'upcoming_reminder',
            delivery_channel: 'email',
            status: 'sent',
            payload: {
              subject,
              body,
              to: tenant.email,
              payment_id: p.id
            }
          });

          summaryLog.push({
            landlord: landlord.full_name,
            tenant: tenant.full_name,
            type: isOverdue ? 'overdue' : 'upcoming',
            amount: p.amount
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Daily billing alerts swept and compiled successfully.",
      reminders_sent: summaryLog
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err: any) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})
