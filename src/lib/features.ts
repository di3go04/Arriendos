/**
 * Feature Flags — control de rollout para las 7 brechas.
 * Usar variables de entorno Vercel (NEXT_PUBLIC_FF_*) para activar/desactivar.
 */

export const FEATURES = {
  OPEN_BANKING_KYC: process.env.NEXT_PUBLIC_FF_OPEN_BANKING_KYC === 'true',
  VOICE_AGENTS: process.env.NEXT_PUBLIC_FF_VOICE_AGENTS === 'true',
  REAAS: process.env.NEXT_PUBLIC_FF_REAAS === 'true',
  VIRTUAL_TOURS: process.env.NEXT_PUBLIC_FF_VIRTUAL_TOURS === 'true',
  IOT_PREDICTIVE: process.env.NEXT_PUBLIC_FF_IOT_PREDICTIVE === 'true',
  ESG: process.env.NEXT_PUBLIC_FF_ESG === 'true',
  RECOMMENDATIONS: process.env.NEXT_PUBLIC_FF_RECOMMENDATIONS === 'true',
  PRICING_AI: process.env.NEXT_PUBLIC_FF_PRICING_AI === 'true',
  RECONCILIATION: process.env.NEXT_PUBLIC_FF_RECONCILIATION === 'true',
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}
