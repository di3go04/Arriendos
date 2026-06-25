export interface PriceSuggestion {
  propertyId: string;
  currentPrice: number;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  marketAvgPrice: number;
  reasoning: string[];
  seasonalityFactor: number;
}

export interface IDynamicPricingService {
  suggestPrice(propertyId: string): Promise<{ ok: true; data: PriceSuggestion } | { ok: false; error: string }>;
  batchSuggestPrices(userId: string): Promise<PriceSuggestion[]>;
}
