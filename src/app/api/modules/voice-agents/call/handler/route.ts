import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const formData = await req.formData();
  const speechResult = formData.get('SpeechResult') as string || '';
  const digits = formData.get('Digits') as string || '';
  const input = (speechResult || digits).toLowerCase().trim();
  const VoiceResponse = (await import('twilio')).twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (input.includes('sí') || input.includes('si') || input.includes('pago') || input.includes('ahora') || digits === '1') {
    twiml.say(
      { voice: 'alice', language: 'es-MX' },
      'Excelente. Te enviaré un enlace de pago por WhatsApp. Revisa tu teléfono. Gracias.'
    );
    twiml.redirect('/api/modules/whatsapp-automation/enqueue');
  } else if (input.includes('fecha') || input.includes('comprom') || input.includes('despues') || input.includes('luego') || digits === '2') {
    twiml.gather({
      input: ['speech', 'dtmf'],
      timeout: 5,
      action: '/api/modules/voice-agents/commitment',
      method: 'POST',
    }).say(
      { voice: 'alice', language: 'es-MX' },
      'Entendido. ¿Para qué fecha te comprometes a realizar el pago? Por favor di una fecha.'
    );
  } else if (input.includes('no') || input.includes('problema') || input.includes('queja')) {
    twiml.say(
      { voice: 'alice', language: 'es-MX' },
      'Lamento los inconvenientes. Voy a escalar tu caso a un asesor humano que te contactará pronto.'
    );
  } else {
    twiml.say(
      { voice: 'alice', language: 'es-MX' },
      'No entendí tu respuesta. Te enviaré un recordatorio por WhatsApp. Recuerda que puedes pagar desde la app. Gracias.'
    );
  }

  const twimlStr = twiml.toString();
  return new NextResponse(twimlStr, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
