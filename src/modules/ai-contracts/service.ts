import { GoogleGenerativeAI } from '@google/generative-ai';
import { isDemoMode } from '@/lib/demo';
import { getDemoContractHTML } from '@/lib/demo-fallbacks';

/** Módulo 16 — generación IA con log de coste estimado */
const COST_PER_1K_TOKENS_USD = 0.00015;

export async function generateContractFromTemplate(opts: {
  countryCode: string;
  templateHtml: string;
  variables: Record<string, string>;
  userId: string;
}) {
  if (isDemoMode()) {
    return {
      ok: true as const,
      content: getDemoContractHTML(opts.variables),
      log: {
        userId: opts.userId,
        countryCode: opts.countryCode,
        estimatedTokens: 1024,
        estimatedCostUsd: 0.00015,
        model: 'gemini-2.0-flash',
        at: new Date().toISOString(),
        demo: true,
      },
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY no configurada' };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `País: ${opts.countryCode}. Completa el contrato HTML respetando legislación local.
Variables: ${JSON.stringify(opts.variables)}
Plantilla base:
${opts.templateHtml}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const estimatedTokens = Math.ceil((prompt.length + text.length) / 4);
  const estimatedCostUsd = (estimatedTokens / 1000) * COST_PER_1K_TOKENS_USD;

  return {
    ok: true as const,
    content: text,
    log: {
      userId: opts.userId,
      countryCode: opts.countryCode,
      estimatedTokens,
      estimatedCostUsd,
      model: 'gemini-2.0-flash',
      at: new Date().toISOString(),
    },
  };
}
