import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { EsgCertification, IEsgService, PortfolioEsgReport, PropertyEsgScore } from './contract';
import { calculateCarbonFootprint, calculateEsgScore } from './calculator';

function mapRow(row: any): PropertyEsgScore {
  return {
    id: row.id,
    propertyId: row.property_id,
    energyKwhYear: Number(row.energy_kwh_year),
    waterM3Year: Number(row.water_m3_year),
    wasteKgYear: Number(row.waste_kg_year),
    carbonFootprintKg: Number(row.carbon_footprint_kg),
    certification: row.certification,
    energyScore: row.energy_score,
    waterScore: row.water_score,
    wasteScore: row.waste_score,
    overallScore: row.overall_score,
    lastAssessment: row.last_assessment,
  };
}

export function createEsgService(): IEsgService {
  const db = () => getSupabaseAdmin();

  return {
    async calculateScore(propertyId, energy, water, waste, certification) {
      const admin = db();
      if (!admin) return { ok: false, error: 'Admin no configurado' };

      const { data: prop } = await admin.from('properties').select('area, monthly_rent').eq('id', propertyId).single();
      const areaM2 = Number(prop?.area) || 60;
      const occupants = Math.ceil(Number(prop?.monthly_rent || 0) / 500000) || 2;

      const carbon = calculateCarbonFootprint(energy, water, waste);
      const { energyScore, waterScore, wasteScore, overallScore } = calculateEsgScore(energy, water, waste, areaM2, occupants);

      const { data, error } = await admin.from('property_esg_scores').upsert({
        property_id: propertyId,
        energy_kwh_year: energy,
        water_m3_year: water,
        waste_kg_year: waste,
        carbon_footprint_kg: carbon,
        certification,
        energy_score: energyScore,
        water_score: waterScore,
        waste_score: wasteScore,
        overall_score: overallScore,
        last_assessment: new Date().toISOString(),
      }, { onConflict: 'property_id' }).select().single();

      if (error) return { ok: false, error: error.message };
      return { ok: true, data: mapRow(data) };
    },

    async getScore(propertyId) {
      const admin = db();
      if (!admin) return null;
      const { data } = await admin.from('property_esg_scores').select('*').eq('property_id', propertyId).maybeSingle();
      return data ? mapRow(data) : null;
    },

    async getPortfolioReport(userId) {
      const admin = db();
      if (!admin) return { totalProperties: 0, certifiedCount: 0, avgCarbonFootprint: 0, totalEnergyKwh: 0, totalWaterM3: 0, topPerformers: [] };

      const { data: props } = await admin.from('properties').select('id').eq('owner_id', userId);
      const propertyIds = (props || []).map(p => p.id);
      if (!propertyIds.length) return { totalProperties: 0, certifiedCount: 0, avgCarbonFootprint: 0, totalEnergyKwh: 0, totalWaterM3: 0, topPerformers: [] };

      const { data: scores } = await admin.from('property_esg_scores').select('*').in('property_id', propertyIds);

      const list = (scores || []).map(mapRow);
      const total = list.length;
      const certified = list.filter(s => s.certification !== 'ninguna').length;
      const avgCarbon = total > 0 ? Math.round(list.reduce((s, x) => s + x.carbonFootprintKg, 0) / total) : 0;
      const totalEnergy = list.reduce((s, x) => s + x.energyKwhYear, 0);
      const totalWater = list.reduce((s, x) => s + x.waterM3Year, 0);
      const topPerformers = [...list].sort((a, b) => b.overallScore - a.overallScore).slice(0, 5).map(s => ({ propertyId: s.propertyId, score: s.overallScore }));

      return { totalProperties: total, certifiedCount: certified, avgCarbonFootprint: avgCarbon, totalEnergyKwh: totalEnergy, totalWaterM3: totalWater, topPerformers };
    },
  };
}
