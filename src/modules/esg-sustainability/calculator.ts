// NOTA: Módulo MVP para la demo. Para producción, conectar a APIs externas de ESG
// (ej. GRESB, Carbon Trust, o proveedores locales de certificación energética).

const EMISSION_FACTORS = {
  energy: 0.233, // kg CO2/kWh (mix LATAM promedio)
  water: 0.298,  // kg CO2/m3 (tratamiento + bombeo)
  waste: 0.425,  // kg CO2/kg (disposición final)
};

const BASELINE_SCORES = {
  energy: { min: 50, max: 300 },  // kWh/m2/año
  water: { min: 15, max: 60 },    // m3/persona/año
  waste: { min: 100, max: 500 },  // kg/persona/año
};

export function calculateCarbonFootprint(energyKwh: number, waterM3: number, wasteKg: number): number {
  return Math.round(
    energyKwh * EMISSION_FACTORS.energy +
    waterM3 * EMISSION_FACTORS.water +
    wasteKg * EMISSION_FACTORS.waste
  );
}

function scoreFromValue(value: number, baselineMin: number, baselineMax: number, inverted = true): number {
  if (value <= baselineMin) return inverted ? 100 : 0;
  if (value >= baselineMax) return inverted ? 0 : 100;
  const ratio = (value - baselineMin) / (baselineMax - baselineMin);
  return Math.round((inverted ? 1 - ratio : ratio) * 100);
}

export function calculateEsgScore(
  energyKwh: number, waterM3: number, wasteKg: number, propertyAreaM2: number, occupants: number
): { energyScore: number; waterScore: number; wasteScore: number; overallScore: number } {
  const energyIntensity = energyKwh / Math.max(propertyAreaM2, 1);
  const waterPerPerson = waterM3 / Math.max(occupants, 1);
  const wastePerPerson = wasteKg / Math.max(occupants, 1);

  const energyScore = scoreFromValue(energyIntensity, BASELINE_SCORES.energy.min, BASELINE_SCORES.energy.max);
  const waterScore = scoreFromValue(waterPerPerson, BASELINE_SCORES.water.min, BASELINE_SCORES.water.max);
  const wasteScore = scoreFromValue(wastePerPerson, BASELINE_SCORES.waste.min, BASELINE_SCORES.waste.max);

  const overallScore = Math.round((energyScore * 0.4 + waterScore * 0.35 + wasteScore * 0.25));
  return { energyScore, waterScore, wasteScore, overallScore };
}

/**
 * Calcula un Score Energético simplificado basado en área y antigüedad de la propiedad.
 * Útil cuando no se tienen mediciones reales de consumo.
 * @param areaM2 - Área construida en metros cuadrados
 * @param yearsOld - Antigüedad en años (0 = construcción nueva)
 * @returns Puntaje de 0 a 100 (100 = máxima eficiencia)
 */
export function calculateEnergyEfficiencyScore(areaM2: number, yearsOld: number): number {
  // Propiedades más pequeñas tienden a ser más eficientes (menos volumen que climatizar)
  const areaFactor = Math.min(1, 200 / Math.max(areaM2, 30))

  // Construcciones más nuevas tienen mejor aislación, materiales eficientes
  const ageFactor = Math.max(0, 1 - yearsOld / 50)

  // Tecnología: propiedades <10 años asumimos construcción reciente con estándares modernos
  const techFactor = yearsOld < 10 ? 1.1 : yearsOld < 20 ? 1.0 : 0.85

  const score = Math.round(Math.min(100, (areaFactor * 0.3 + ageFactor * 0.5 + techFactor * 0.2) * 100))
  return Math.max(0, score)
}
