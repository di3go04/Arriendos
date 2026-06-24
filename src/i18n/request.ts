import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale && locales.includes(locale as typeof locales[number])
    ? locale
    : defaultLocale;

  const messages = (await import(`../messages/${resolvedLocale}.json`)).default;

  return {
    locale: resolvedLocale,
    messages,
  };
});

export type Messages = Record<string, unknown>;

export async function getMessages(locale: string): Promise<Messages> {
  try {
    const data = await import(`../messages/${locale}.json`);
    return data.default;
  } catch {
    const data = await import(`../messages/es.json`);
    return data.default;
  }
}
