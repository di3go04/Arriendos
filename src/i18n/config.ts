export const locales = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
export type Locale = typeof locales[number];
export const defaultLocale = 'es';
