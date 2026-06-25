import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { isDemoMode } from '@/lib/demo';
import { getDemoMarketingContent } from '@/lib/demo-fallbacks';
import type { IMarketingService, MarketingContent } from './contract';

const genAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
};

function buildPropertyPrompt(property: any, task: string): string {
  return `Eres un copywriter experto en inmobiliario LATAM. Genera contenido para una propiedad:

DATOS:
- Título: ${property.title || 'Sin título'}
- Tipo: ${property.type || 'casa'}
- Área: ${property.area || 0}m²
- Habitaciones: ${property.bedrooms || 0}
- Baños: ${property.bathrooms || 0}
- Ciudad: ${property.city || ''}
- Precio mensual: $${property.monthly_rent || 0}
- Descripción actual: ${property.description || ''}
- Amenities: ${property.amenities?.join(', ') || 'No especificadas'}

TAREA: ${task}

Idioma: español LATAM. Tono: profesional, persuasivo pero sin exageraciones. Responde SOLO con el JSON solicitado.`;
}

export function createMarketingService(): IMarketingService {
  return {
    async generatePropertyContent(propertyId) {
      if (isDemoMode()) {
        const demo = getDemoMarketingContent();
        return { ok: true, data: demo as any };
      }

      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { data: property } = await admin.from('properties').select('*').eq('id', propertyId).single();
      if (!property) return { ok: false, error: 'Propiedad no encontrada' };

      const ai = genAI();
      if (!ai) return { ok: false, error: 'GEMINI_API_KEY no configurada' };

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = buildPropertyPrompt(property, `
Genera un JSON con este formato exacto:
{
  "title": "Título SEO para la propiedad (máx 60 caracteres)",
  "description": "Descripción persuasiva para el portal (máx 200 caracteres)",
  "seoDescription": "Meta description para Google (máx 160 caracteres)",
  "highlights": ["3 bullet points destacados"],
  "socialCopy": "Texto para Instagram (máx 280 caracteres, con emojis)",
  "metaTags": ["palabras", "clave", "SEO", "relevantes"],
  "suggestedAmenities": ["amenidad", "sugerida", "basada en tendencias"]
}`);

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json|```/g, '').trim();
      const content: MarketingContent = JSON.parse(clean);

      await admin.from('properties').update({
        title: content.title,
        description: content.description,
        meta_description: content.seoDescription,
        seo_tags: content.metaTags,
      }).eq('id', propertyId);

      return { ok: true, data: content };
    },

    async generateSocialPost(propertyId, platform) {
      if (isDemoMode()) {
        const demo = getDemoMarketingContent();
        return { ok: true, data: { post: demo.socialCopy, hashtags: demo.metaTags.map((t) => `#${t}`) } };
      }

      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { data: property } = await admin.from('properties').select('*').eq('id', propertyId).single();
      if (!property) return { ok: false, error: 'Propiedad no encontrada' };

      const ai = genAI();
      if (!ai) return { ok: false, error: 'GEMINI_API_KEY no configurada' };

      const platformTips: Record<string, string> = {
        instagram: 'Visual, aspiracional, con emojis. Máx 280 caracteres + 5 hashtags.',
        tiktok: 'Guión informal para video de 30 seg. Enganche en primeros 3 segundos.',
        linkedin: 'Tono profesional, datos de mercado, llamada a la acción seria.',
      };

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = buildPropertyPrompt(property, `
Genera contenido para ${platform}. ${platformTips[platform] || platformTips.instagram}
Responde SOLO con JSON: { "post": "texto del post", "hashtags": ["#tag1", "#tag2"] }`);

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const clean = text.replace(/```json|```/g, '').trim();

      try {
        const data = JSON.parse(clean);
        return { ok: true, data };
      } catch {
        return { ok: true, data: { post: clean, hashtags: ['#RentNow', '#PropTech'] } };
      }
    },
  };
}
