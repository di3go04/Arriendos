import { NextResponse } from 'next/server';
import { SECURITY_HEADERS } from './headers';

/** Aplica headers OWASP a cualquier respuesta del proxy o route handler */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
