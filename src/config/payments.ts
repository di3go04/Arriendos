// Sistema de Pagos Internacional - Sin dependencias externas
// No requiere Stripe, PayPal ni ninguna API key
// Usa enlaces universales que funcionan en cualquier país

// ============================================================
// 🌍 MONEDAS SOPORTADAS (Internacional)
// ============================================================
export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dólar estadounidense', locale: 'en-US' },
  COP: { symbol: '$', name: 'Peso colombiano', locale: 'es-CO' },
  MXN: { symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  EUR: { symbol: '€', name: 'Euro', locale: 'es-ES' },
  ARS: { symbol: '$', name: 'Peso argentino', locale: 'es-AR' },
  BRL: { symbol: 'R$', name: 'Real brasileño', locale: 'pt-BR' },
  CLP: { symbol: '$', name: 'Peso chileno', locale: 'es-CL' },
  PEN: { symbol: 'S/', name: 'Sol peruano', locale: 'es-PE' },
  GBP: { symbol: '£', name: 'Libra esterlina', locale: 'en-GB' },
};

export type CurrencyCode = keyof typeof CURRENCIES;

// ============================================================
// 🔗 ENLACES DE PAGO (Edítalos con tus propios links)
// ============================================================
// Puedes usar cualquiera de estos:
// - PayPal.Me: https://www.paypal.me/tuusuario
// - Buy Me a Coffee: https://buymeacoffee.com/tuusuario
// - Ko-fi: https://ko-fi.com/tuusuario
// - Wise: https://wise.com/pay/tuusuario
// - Mercado Pago: link de tu tienda
// - O simplemente datos de cuenta bancaria
export const PAYMENT_LINKS = {
  general: 'https://www.paypal.me/rentnow', // Cambia por tu link de pago
  planBasico: '',
  planProfesional: 'https://www.paypal.me/rentnow/12',
  planEmpresa: 'https://www.paypal.me/rentnow/24',
};

// ============================================================
// 💰 DATOS DE TRANSFERENCIA BANCARIA INTERNACIONAL
// ============================================================
// Edita con tus propios datos para pagos por transferencia
export const BANK_INFO = {
  COP: {
    bank: 'Bancolombia',
    accountType: 'Cuenta de Ahorros',
    accountNumber: '000-000000-00',
    holderName: 'Tu Nombre',
    holderId: 'CC 123.456.789',
    email: 'tu@email.com',
  },
  USD: {
    bank: 'Bank of America',
    accountType: 'Checking Account',
    accountNumber: '123456789',
    routingNumber: '021000322',
    holderName: 'Your Name',
    holderEmail: 'your@email.com',
  },
  EUR: {
    bank: 'BBVA',
    iban: 'ES00 0000 0000 0000 0000 0000',
    bic: 'BBVAESMMXXX',
    holderName: 'Tu Nombre',
  },
};

// ============================================================
// 🏷️ PLANES DE SUSCRIPCIÓN - PRECIOS INTERNACIONALES
// ============================================================
export const PRICING: Record<string, {
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  period: string;
  popular: boolean;
  features: string[];
  prices: Record<string, number>;
}> = {
  basico: {
    name: 'Básico',
    description: 'Para empezar a gestionar tus propiedades',
    price: 0,
    currency: 'USD' as CurrencyCode,
    period: '',
    popular: false,
    features: [
      'Hasta 2 propiedades',
      'Hasta 2 inquilinos',
      'Plantillas de contrato básicas',
      'Recordatorios por email',
      'Panel de control simple',
    ],
    prices: {
      USD: 0,
      COP: 0,
      MXN: 0,
      EUR: 0,
      BRL: 0,
    },
  },
  profesional: {
    name: 'Profesional',
    description: 'Para arrendadores con varias propiedades',
    price: 12,
    currency: 'USD' as CurrencyCode,
    period: '/mes',
    popular: true,
    features: [
      'Hasta 10 propiedades',
      'Inquilinos ilimitados',
      'Plantillas con IA ilimitadas',
      'Firma digital de contratos',
      'Recordatorios automáticos',
      'Soporte prioritario',
      'Reportes financieros',
      'API de integración',
    ],
    prices: {
      USD: 12,
      COP: 49900,
      MXN: 200,
      EUR: 11,
      BRL: 60,
    },
  },
  empresa: {
    name: 'Empresa',
    description: 'Para agencias y property managers',
    price: 24,
    currency: 'USD' as CurrencyCode,
    period: '/mes',
    popular: false,
    features: [
      'Propiedades ilimitadas',
      'Inquilinos ilimitados',
      'Todo lo del plan Profesional',
      'Multi-usuario (hasta 10)',
      'Soporte 24/7',
      'Capacitación personalizada',
      'SLA garantizado',
      'White label disponible',
    ],
    prices: {
      USD: 24,
      COP: 99900,
      MXN: 400,
      EUR: 22,
      BRL: 120,
    },
  },
};