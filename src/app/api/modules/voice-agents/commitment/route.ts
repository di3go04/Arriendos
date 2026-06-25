import { NextResponse } from 'next/server';
import { createVoiceAgentsService } from '@/modules/voice-agents/service';

export async function POST(req: Request) {
  const formData = await req.formData();
  const speechResult = formData.get('SpeechResult') as string || '';
  const digits = formData.get('Digits') as string || '';
  const from = formData.get('From') as string || '';

  const input = (speechResult || digits).trim();
  const VoiceResponse = (await import('twilio')).twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const dateMatch = input.match(/(\d{1,2})\s*(de\s+)?(\w+)?/i) || input.match(/(\d{4}-\d{2}-\d{2})/);
  let promisedDate: string;

  if (dateMatch) {
    promisedDate = dateMatch[1]
      ? new Date(`${dateMatch[3] || 'next'} ${dateMatch[1]}, ${new Date().getFullYear()}`).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString();
  } else {
    promisedDate = new Date(Date.now() + 7 * 86400000).toISOString();
  }

  try {
    await createVoiceAgentsService().registerCommitment(
      formData.get('contractId') as string || 'unknown',
      from,
      Number(formData.get('debtAmount') || 0),
      promisedDate,
      'voice_commitment'
    );
  } catch { /* swalow */ }

  twiml.say(
    { voice: 'alice', language: 'es-MX' },
    'Perfecto. He registrado tu compromiso de pago. Te enviaré un recordatorio. Gracias.'
  );

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
