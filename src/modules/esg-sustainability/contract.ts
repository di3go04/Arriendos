export type EsgCertification = 'edge' | 'leed' | 'ninguna';

export interface PropertyEsgScore {
  id: string;
  propertyId: string;
  energyKwhYear: number;
  waterM3Year: number;
  wasteKgYear: number;
  carbonFootprintKg: number;
  certification: EsgCertification;
  energyScore: number;
  waterScore: number;
  wasteScore: number;
  overallScore: number;
  lastAssessment: string;
}

export interface PortfolioEsgReport {
  totalProperties: number;
  certifiedCount: number;
  avgCarbonFootprint: number;
  totalEnergyKwh: number;
  totalWaterM3: number;
  topPerformers: { propertyId: string; score: number }[];
}

export interface IEsgService {
  calculateScore(propertyId: string, energy: number, water: number, waste: number, certification: EsgCertification): Promise<{ ok: true; data: PropertyEsgScore } | { ok: false; error: string }>;
  getScore(propertyId: string): Promise<PropertyEsgScore | null>;
  getPortfolioReport(userId: string): Promise<PortfolioEsgReport>;
}
