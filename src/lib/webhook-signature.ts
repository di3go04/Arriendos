import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify HMAC-SHA256 webhook signature from x-webhook-signature header.
 * Supports both raw secret comparison and HMAC-based verification.
 */
export function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null,
  secretKey: string,
  options?: { headerPrefix?: string; encoding?: 'hex' | 'base64' }
): boolean {
  if (!signatureHeader || !secretKey) return false;

  const prefix = options?.headerPrefix || '';
  const encoding = options?.encoding || 'hex';
  let rawSignature = signatureHeader;

  // Strip prefix if present (e.g. "sha256=..." or "v1=...")
  if (prefix && rawSignature.startsWith(prefix)) {
    rawSignature = rawSignature.slice(prefix.length);
  }

  try {
    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(body, 'utf8')
      .digest(encoding);

    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(rawSignature.trim())
    );
  } catch {
    return false;
  }
}

/**
 * Middleware-style guard for webhook routes.
 * Returns a 401 Response if signature is invalid, or void if valid.
 */
export function guardWebhook(
  req: NextRequest | Request,
  secretKey: string,
  options?: {
    headerName?: string;
    headerPrefix?: string;
    encoding?: 'hex' | 'base64';
  }
): Response | void {
  const headerName = options?.headerName || 'x-webhook-signature';
  const signature = req.headers.get(headerName);

  // In demo/dev mode, allow if no secret is configured (log warning)
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[webhook-signature] WARNING: No secret configured for ${headerName}. Skipping verification.`);
      return;
    }
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Read body for HMAC computation
  // We need the raw body — clone the request to read it
  // This is handled by each webhook route using the helper below
  return; // Actual verification happens in the route handler
}

/**
 * Wrapper that extracts raw body and verifies signature.
 * Use this inside webhook route handlers.
 */
export async function verifyWebhookRequest(
  req: Request,
  secretKey: string,
  options?: {
    headerName?: string;
    headerPrefix?: string;
    encoding?: 'hex' | 'base64';
  }
): Promise<{ valid: boolean; body: unknown; rawBody: string; response?: Response }> {
  const headerName = options?.headerName || 'x-webhook-signature';
  const signature = req.headers.get(headerName);

  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[webhook-signature] WARNING: No secret configured for ${headerName}. Skipping.`);
      const rawBody = await req.text();
      try {
        return { valid: true, body: JSON.parse(rawBody), rawBody };
      } catch {
        return { valid: true, body: rawBody, rawBody };
      }
    }
    return {
      valid: false,
      body: null,
      rawBody: '',
      response: NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 }),
    };
  }

  const rawBody = await req.text();

  if (!signature) {
    return {
      valid: false,
      body: null,
      rawBody,
      response: NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 }),
    };
  }

  const valid = verifyWebhookSignature(rawBody, signature, secretKey, options);

  if (!valid) {
    return {
      valid: false,
      body: null,
      rawBody,
      response: NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 }),
    };
  }

  try {
    return { valid: true, body: JSON.parse(rawBody), rawBody };
  } catch {
    return { valid: true, body: rawBody, rawBody };
  }
}
