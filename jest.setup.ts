import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import type { TranslationValues } from 'next-intl';

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

// Mock next-intl so component tests don't need a full i18n provider.
// Returns the translation key as-is (with values interpolated) which is enough
// for asserting visibility / presence in tests.
jest.mock('next-intl', () => ({
  useTranslations: (_namespace?: string) => {
    const t = (key: string, values?: TranslationValues) => {
      let s = key;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return s;
    };
    return t;
  },
  useLocale: () => 'es',
  useFormatter: () => ({
    number: (v: unknown) => String(v),
    dateTime: (v: unknown) => String(v),
  }),
  useNow: () => new Date(),
  useTimeZone: () => 'UTC',
  useMessages: () => ({}),
}));
