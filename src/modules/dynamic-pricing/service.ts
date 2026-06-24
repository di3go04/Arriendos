import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { IDynamicPricingService, PriceSuggestion } from './contract';
import { calculateMarketPrice, generateReasoning } from './calculator';

export function createDynamicPricingService(): IDynamicPricingService {
  const db = () => getSupabaseAdmin();

  return {
    async suggestPrice(propertyId) {
      const admin = db();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { data: prop } = await admin.from('properties').select('*').eq('id', propertyId).single();
      if (!prop) return { ok: false, error: 'Propiedad no encontrada' };

      const { marketAvg, minPrice, maxPrice } = calculateMarketPrice(
        prop.city || '',
        Number(prop.area) || 60,
        prop.bedrooms || 0,
        prop.bathrooms || 0,
        prop.type || 'casa'
      );

      const currentPrice = Number(prop.monthly_rent) || 0;
      const confidence = marketAvg > 0 ? Math.min(0.95, 1 - Math.abs(currentPrice - marketAvg) / marketAvg * 0.5) : 0.5;
      const season = [0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2, 1.15, 1.05, 0.95, 0.9, 0.85][new Date().getMonth()];

      const suggestion: PriceSuggestion = {
        propertyId,
        currentPrice,
        suggestedPrice: marketAvg,
        minPrice,
        maxPrice,
        confidence: Math.round(confidence * 100) / 100,
        marketAvgPrice: marketAvg,
        reasoning: generateReasoning(currentPrice, marketAvg, confidence),
        seasonalityFactor: season,
      };

      return { ok: true, data: suggestion };
    },

    async batchSuggestPrices(userId) {
      const admin = db();
      if (!admin) return [];

      const { data: properties } = await admin.from('properties').select('id').eq('owner_id', userId);
      if (!properties?.length) return [];

      const results: PriceSuggestion[] = [];
      for (const prop of properties) {
        const result = await this.suggestPrice(prop.id);
        if (result.ok) results.push(result.data);
      }
      return results;
    },
  };
}
