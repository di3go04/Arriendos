import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
});

if (typeof Request === 'undefined' || typeof Response === 'undefined' || typeof Headers === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('whatwg-fetch');
}

if (typeof Response !== 'undefined' && !Response.json) {
  Response.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
}
