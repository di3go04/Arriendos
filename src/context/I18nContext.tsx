'use client';

import { createContext, useContext, ReactNode } from 'react';

type I18nContextType = {
  t: (key: string, variables?: Record<string, string | number>) => string;
  locale: string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function resolveMessage(messages: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);

  return typeof value === 'string' ? value : undefined;
}

export const I18nProvider = ({ locale, messages, children }: { locale: string; messages: Record<string, unknown>; children: ReactNode }) => {
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

  return (
    <I18nContext.Provider value={{ t, locale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('I18nContext must be used within I18nProvider');
  return context;
};
