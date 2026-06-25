const BRIDGE_URL =
  process.env.WHATSAPP_BRIDGE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3001' : '');
const BRIDGE_SECRET = process.env.WHATSAPP_BRIDGE_SECRET || '';

export function getWhatsAppBridgeUrl() {
  return BRIDGE_URL;
}

export function isWhatsAppBridgeConfigured() {
  return Boolean(BRIDGE_URL);
}

/** Comprueba si el proceso Baileys responde (GET /health). */
export async function checkWhatsAppBridgeHealth(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!BRIDGE_URL) {
    return { ok: false, error: 'WHATSAPP_BRIDGE_URL no definida' };
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
      headers: BRIDGE_SECRET ? { 'x-bridge-secret': BRIDGE_SECRET } : {},
    });
    if (!res.ok) {
      return { ok: false, error: `Bridge HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: Boolean(data.ok), error: data.ok ? undefined : 'Bridge sin conexión WhatsApp' };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Bridge no alcanzable',
    };
  }
}

export async function sendWhatsAppViaBridge(numero: string, texto: string) {
  if (!BRIDGE_URL) {
    return {
      success: false,
      message:
        'WhatsApp no configurado. Define WHATSAPP_BRIDGE_URL (ej. http://127.0.0.1:3001) y ejecuta npm run whatsapp:bridge.',
    };
  }

  try {
    const res = await fetch(`${BRIDGE_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(BRIDGE_SECRET ? { 'x-bridge-secret': BRIDGE_SECRET } : {}),
      },
      body: JSON.stringify({ numero, texto }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message:
          (data as { error?: string }).error ||
          `Bridge respondió ${res.status}. ¿Está corriendo npm run whatsapp:bridge?`,
      };
    }
    return { success: true, provider: 'baileys' as const, ...data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de conexión con WhatsApp bridge';
    return {
      success: false,
      message: `${message}. Ejecuta: npm run whatsapp:bridge`,
    };
  }
}
