// NOTA: Módulo MVP para la demo. Para producción, conectar a APIs externas de ML de precios
// (ej. AirDNA, Mashvisor, o modelos de regresión con datos históricos locales).

const MARKET_MULTIPLIERS: Record<string, { base: number; perM2: number; perBedroom: number; perBathroom: number }> = {
  bogota: { base: 800000, perM2: 15000, perBedroom: 200000, perBathroom: 150000 },
  medellin: { base: 700000, perM2: 12000, perBedroom: 180000, perBathroom: 120000 },
  default: { base: 500000, perM2: 10000, perBedroom: 150000, perBathroom: 100000 },
};

const SEASONAL_FACTORS: Record<string, number> = {
  '0': 1.0, '1': 0.95, '2': 0.95, '3': 1.0,
  '4': 1.0, '5': 1.05, '6': 1.15, '7': 1.10,
  '8': 1.0, '9': 0.95, '10': 0.90, '11': 0.95,
};

export function calculateMarketPrice(
  city: string, areaM2: number, bedrooms: number, bathrooms: number, propertyType: string
): { marketAvg: number; minPrice: number; maxPrice: number } {
  const multipliers = MARKET_MULTIPLIERS[city?.toLowerCase()] || MARKET_MULTIPLIERS.default;
  const basePrice = multipliers.base + (areaM2 * multipliers.perM2) + (bedrooms * multipliers.perBedroom) + (bathrooms * multipliers.perBathroom);

  const typeFactor = propertyType === 'apartamento' ? 1.0 : propertyType === 'casa' ? 1.15 : 1.0;
  const month = String(new Date().getMonth());
  const seasonalFactor = SEASONAL_FACTORS[month] || 1.0;

  const marketAvg = Math.round(basePrice * typeFactor * seasonalFactor);
  return {
    marketAvg,
    minPrice: Math.round(marketAvg * 0.85),
    maxPrice: Math.round(marketAvg * 1.2),
  };
}

/**
 * Ajusta el precio base según la tasa de ocupación actual.
 * A mayor ocupación, mayor precio (ley de oferta y demanda).
 * @param basePrice - Precio base sugerido por el mercado
 * @param occupancyPercent - Ocupación actual (0-100)
 * @returns Precio ajustado por ocupación
 */
export function adjustPriceByOccupancy(basePrice: number, occupancyPercent: number): number {
  // Si ocupación > 80%, hay alta demanda → subir precio hasta +20%
  // Si ocupación < 40%, hay baja demanda → bajar precio hasta -15%
  // Ocupación entre 40-80% → ajuste lineal mínimo
  let factor: number
  if (occupancyPercent >= 80) {
    factor = 1 + ((occupancyPercent - 80) / 100) * 0.5 // +0% a +10%
  } else if (occupancyPercent <= 40) {
    factor = 1 - ((40 - occupancyPercent) / 100) * 0.375 // -0% a -15%
  } else {
    // Rango normal (40-80%): ajuste neutral con leve incremento
    factor = 1 + ((occupancyPercent - 60) / 100) * 0.1
  }
  return Math.round(basePrice * factor)
}

export function generateReasoning(currentPrice: number, marketAvg: number, confidence: number): string[] {
  const reasons: string[] = [];
  const ratio = currentPrice / marketAvg;

  if (ratio < 0.85) reasons.push('El precio actual está significativamente por debajo del promedio de mercado');
  else if (ratio > 1.15) reasons.push('El precio actual está por encima del promedio de mercado');

  if (confidence > 0.8) reasons.push('Alta confianza en la estimación basada en datos comparables');
  else reasons.push('Confianza moderada: se recomienda validar con propiedades similares cercanas');

  return reasons;
}
