// src/lib/apiErrorWrapper.ts
/**
 * Wrapper for Next.js App‑Router API routes.
 * It catches any thrown error and returns a JSON response.
 * In development we expose the message + stack; in production we hide details.
 */
export function withErrorHandler(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>
) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err: unknown) {
      // Log the full error for debugging (server logs are safe)
      console.error('[API‑ERROR]', err);

      const isDev = process.env.NODE_ENV === 'development';
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      const payload: Record<string, unknown> = { error: isDev ? message : 'Internal Server Error' };
      if (isDev && err instanceof Error) {
        payload.stack = err.stack;
      }
      return new Response(JSON.stringify(payload), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
