/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { isDemoMode, getMockId } from '@/lib/demo';
import { getDemoVoiceCallResult } from '@/lib/demo-fallbacks';
import type { IVoiceAgentsService, PaymentCommitment, VoiceCallRequest, VoiceCallResult } from './contract';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY || '';
const VOICEFLOW_AGENT_ID = process.env.VOICEFLOW_AGENT_ID || '';

function mapCommitment(row: any): PaymentCommitment {
  return {
    id: row.id,
    contractId: row.contract_id,
    tenantId: row.tenant_id,
    promisedAmount: Number(row.promised_amount),
    promisedDate: row.promised_date,
    status: row.status,
    callSid: row.call_sid,
    callTranscript: row.call_transcript,
    intentDetected: row.intent_detected || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

export function createVoiceAgentsService(): IVoiceAgentsService {
  const db = () => getSupabaseAdmin();

  return {
    async initiateCollectionCall(request: VoiceCallRequest) {
      if (isDemoMode()) {
        const demo = getDemoVoiceCallResult(request.tenantName, request.debtAmount);
        const admin = db();
        if (admin) {
          await admin.from('payment_commitments').insert({
            contract_id: request.contractId,
            tenant_id: request.tenantId,
            promised_amount: demo.commitment.amount,
            promised_date: demo.commitment.promisedDate,
            status: 'pending',
            call_sid: demo.callSid,
            call_transcript: demo.transcript,
            intent_detected: demo.commitment.intent,
            notes: `[DEMO] Llamada simulada a ${request.tenantName}`,
          }).select().single();
        }
        return {
          ok: true,
          callSid: demo.callSid,
          status: 'completed',
          error: undefined,
        };
      }

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        return { ok: false, callSid: '', status: 'unconfigured', error: 'Twilio no configurado' };
      }

      const VoiceResponse = (await import('twilio')).twiml.VoiceResponse;
      const twiml = new VoiceResponse();

      const gather = twiml.gather({
        input: ['speech', 'dtmf'],
        timeout: 5,
        speechTimeout: 'auto',
        action: '/api/modules/voice-agents/call/handler',
        method: 'POST',
      });

      gather.say(
        { voice: 'alice', language: 'es-MX' },
        `Hola ${request.tenantName}, soy el asistente de cobranza de RentNow. ` +
        `Te llamo porque tu pago de $${request.debtAmount} con vencimiento ` +
        `el ${request.dueDate} tiene ${request.daysOverdue} días de retraso. ` +
        `¿Podrías realizar el pago hoy? Di "sí" para pagar ahora o "fecha" para comprometerte.`
      );

      twiml.say(
        { voice: 'alice', language: 'es-MX' },
        'No recibí respuesta. Te enviaré un recordatorio por WhatsApp. Recuerda que puedes pagar desde la app. Gracias.'
      );

      try {
        const twilio = (await import('twilio')).default;
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const call = await client.calls.create({
          twiml: twiml.toString(),
          to: request.tenantPhone,
          from: TWILIO_FROM_NUMBER,
          statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/modules/voice-agents/call/status`,
          statusCallbackEvent: ['completed', 'answered', 'busy', 'failed', 'no-answer'],
          statusCallbackMethod: 'POST',
        });

        return { ok: true, callSid: call.sid, status: call.status };
      } catch (err) {
        return { ok: false, callSid: '', status: 'error', error: err instanceof Error ? err.message : 'Error al iniciar llamada' };
      }
    },

    async processCallCompletion(callSid: string, transcript: string, intent: string) {
      const admin = db();
      if (!admin) return null;

      const { data } = await admin.from('payment_commitments')
        .update({ call_transcript: transcript, intent_detected: intent })
        .eq('call_sid', callSid)
        .select()
        .single();

      return data ? mapCommitment(data) : null;
    },

    async registerCommitment(contractId: string, tenantId: string, amount: number, promisedDate: string, intent: string) {
      const admin = db();
      if (!admin) throw new Error('Admin no configurado');

      const { data, error } = await admin.from('payment_commitments').insert({
        contract_id: contractId,
        tenant_id: tenantId,
        promised_amount: amount,
        promised_date: promisedDate,
        status: 'pending',
        intent_detected: intent,
        notes: `Compromiso registrado por agente de voz: ${intent}`,
      }).select().single();

      if (error) throw new Error(error.message);
      return mapCommitment(data);
    },

    async getPendingCommitments(tenantId: string) {
      const admin = db();
      if (!admin) return [];
      const { data } = await admin.from('payment_commitments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return (data || []).map(mapCommitment);
    },

    getCollectionScript() {
      return SCRIPT_COBRANZA;
    },
  };
}

const SCRIPT_COBRANZA = `# Guión de Agente de Voz — Cobranza Amigable (Español LATAM)

## Contexto
El agente llama a inquilinos con pagos vencidos. Tono: profesional, empático pero firme.

## Flujo de llamada

### 1. Apertura
"Buenos días/tardes [Nombre], soy el asistente de cobranza de RentNow.
Hablamos por el recibo de arriendo de tu propiedad en [Dirección],
que tiene un valor de $[Monto] con vencimiento el [Fecha] y presenta [Días] días de mora."

### 2. Pregunta principal
"¿Te es posible realizar el pago el día de hoy?"

### 3. Opciones según respuesta

**Si dice SÍ:**
"Excelente. Puedes pagar ahora a través de:
- Enlace de pago: Te lo envío por WhatsApp
- Transferencia bancaria a la cuenta: [Cuenta]
- Tarjeta de crédito/débito en la app

¿Por cuál medio prefieres pagar?"

**Si dice NO / NO PUEDE HOY:**
"Entiendo. ¿Para qué fecha te comprometes a realizar el pago?
Recuerda que entre más se acumulen los días, pueden generarse intereses de mora."

**Si da una fecha:**
"Perfecto, agendo el compromiso de pago para el [Fecha] por $[Monto].
Te enviaré un recordatorio por WhatsApp el día anterior. ¿Te parece bien?"

**Si se queja / problema:**
"Lamento los inconvenientes. Voy a escalar tu caso a un asesor humano
que te contactará en las próximas 24 horas. ¿Hay algo más que deba saber?"

### 4. Cierre
"Gracias [Nombre], que tengas buen día. Recuerda que puedes
gestionar tus pagos desde la app o escribirnos por WhatsApp al [Número]."

### 5. Escalamiento (si aplica)
Si el inquilino dice "no voy a pagar" o se muestra agresivo:
"Entiendo tu situación. Voy a transferirte con un asesor especializado.
Por favor espera un momento."
`;
