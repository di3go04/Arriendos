/**
 * Obtiene Access Token de Mercado Pago vía OAuth.
 *
 * Uso (desde la raíz del proyecto):
 *   node scripts/mp-oauth-token.mjs
 *
 * Variables en .env.local:
 *   MP_CLIENT_ID, MP_CLIENT_SECRET
 *   MP_OAUTH_TOKEN_URL (opcional, default https://api.mercadopago.com/oauth/token)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.error('No se encontró .env.local');
    process.exit(1);
  }
}

loadEnvLocal();

const clientId = process.env.MP_CLIENT_ID;
const clientSecret = process.env.MP_CLIENT_SECRET;
const tokenUrl = process.env.MP_OAUTH_TOKEN_URL || 'https://api.mercadopago.com/oauth/token';

if (!clientId || !clientSecret) {
  console.error(`
Faltan MP_CLIENT_ID y MP_CLIENT_SECRET en .env.local.

Alternativa más simple (recomendada):
  Copia el Access Token directo del panel de Mercado Pago → Credenciales → Access Token
  y pégalo en MP_ACCESS_TOKEN (formato TEST-... o APP_USR-...).

OAuth solo si tu app usa flujo OAuth con Client ID + Client Secret.
`);
  process.exit(1);
}

const res = await fetch(tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error('Error OAuth:', data);
  process.exit(1);
}

console.log('\n✅ Access Token obtenido. Añade esto a .env.local:\n');
console.log(`MP_ACCESS_TOKEN=${data.access_token}`);
if (data.public_key) {
  console.log(`NEXT_PUBLIC_MP_PUBLIC_KEY=${data.public_key}`);
}
console.log(`\nExpira en ${data.expires_in}s | live_mode: ${data.live_mode}\n`);
