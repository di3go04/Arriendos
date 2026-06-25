import { cookies, headers } from 'next/headers';
import { getMessages } from '@/i18n/request';

function resolveMessage(messages: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === 'string' ? value : undefined;
}

export async function getTranslationsServer() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const locale = headerStore.get('x-locale') || cookieStore.get('RentNow_locale')?.value || 'en';
  const messages = await getMessages(locale);

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const resolvedMessage = resolveMessage(messages, key);
    if (!resolvedMessage) {
      return key;
    }

    let message = resolvedMessage;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        message = message
          .replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
          .replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return message;
  };

  return {
    locale,
    t,
    messages,
  };
}
