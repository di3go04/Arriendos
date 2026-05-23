/**
 * Intercambio OAuth de Mercado Pago → Access Token.
 * POST https://api.mercadopago.com/oauth/token
 *
 * Requiere MP_CLIENT_ID y MP_CLIENT_SECRET en .env (panel Developers → Credenciales).
 * El Access Token resultante se guarda en MP_ACCESS_TOKEN.
 */

const DEFAULT_OAUTH_URL = 'https://api.mercadopago.com/oauth/token';

export interface MercadoPagoOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  user_id?: number;
  refresh_token?: string;
  public_key?: string;
  live_mode?: boolean;
}

export interface FetchOAuthTokenInput {
  clientId: string;
  clientSecret: string;
  /** client_credentials | authorization_code | refresh_token */
  grantType?: 'client_credentials' | 'authorization_code' | 'refresh_token';
  code?: string;
  refreshToken?: string;
  redirectUri?: string;
  tokenUrl?: string;
}

export async function fetchMercadoPagoOAuthToken(
  input: FetchOAuthTokenInput
): Promise<{ ok: true; data: MercadoPagoOAuthResponse } | { ok: false; error: string }> {
  const grantType = input.grantType ?? 'client_credentials';
  const url = input.tokenUrl?.trim() || process.env.MP_OAUTH_TOKEN_URL?.trim() || DEFAULT_OAUTH_URL;

  const body: Record<string, string> = {
    client_id: input.clientId,
    client_secret: input.clientSecret,
    grant_type: grantType,
  };

  if (grantType === 'authorization_code') {
    if (!input.code || !input.redirectUri) {
      return { ok: false, error: 'authorization_code requiere code y redirectUri' };
    }
    body.code = input.code;
    body.redirect_uri = input.redirectUri;
  }

  if (grantType === 'refresh_token') {
    if (!input.refreshToken) {
      return { ok: false, error: 'refresh_token requiere refreshToken' };
    }
    body.refresh_token = input.refreshToken;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as MercadoPagoOAuthResponse & { message?: string; error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: json.message || json.error || `OAuth MP HTTP ${res.status}`,
      };
    }

    if (!json.access_token) {
      return { ok: false, error: 'Respuesta OAuth sin access_token' };
    }

    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de red OAuth MP' };
  }
}

/** Valida que MP_ACCESS_TOKEN responda contra la API de MP */
export async function validateMercadoPagoAccessToken(accessToken: string) {
  try {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      return { valid: false, status: res.status };
    }
    const data = (await res.json()) as { id?: number; nickname?: string };
    return { valid: true, userId: data.id, nickname: data.nickname };
  } catch {
    return { valid: false, status: 0 };
  }
}
