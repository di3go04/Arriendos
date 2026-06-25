import { BASE_SALE_VALUE_USD } from './registry';
import { detectAllImprovementStatuses, mergeStatusWithDefinitions } from './detector';

export interface PremiumValuationSummary {
  baseSaleValueUsd: number;
  totalSaleValueAddedUsd: number;
  totalSaleValueUnlockedUsd: number;
  estimatedSalePriceUsd: number;
  totalImplementationCostUsd: number;
  totalImplementationHours: number;
  implementedCount: number;
  partialCount: number;
  pendingCount: number;
  completionPercent: number;
}

export function computePremiumValuation(): {
  items: ReturnType<typeof mergeStatusWithDefinitions>;
  summary: PremiumValuationSummary;
} {
  const statuses = detectAllImprovementStatuses();
  const items = mergeStatusWithDefinitions(statuses);

  const totalSaleValueAddedUsd = items.reduce((s, i) => s + i.saleValueAddedUsd, 0);
  const totalSaleValueUnlockedUsd = items.reduce((s, i) => s + i.saleValueUnlockedUsd, 0);
  const totalImplementationCostUsd = items.reduce((s, i) => s + i.implementationCostUsd, 0);
  const totalImplementationHours = items.reduce((s, i) => s + i.implementationHours, 0);

  const implementedCount = items.filter((i) => i.status === 'implemented').length;
  const partialCount = items.filter((i) => i.status === 'partial').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  const completionPercent = Math.round(
    ((implementedCount + partialCount * 0.4) / items.length) * 100
  );

  return {
    items,
    summary: {
      baseSaleValueUsd: BASE_SALE_VALUE_USD,
      totalSaleValueAddedUsd,
      totalSaleValueUnlockedUsd,
      estimatedSalePriceUsd: BASE_SALE_VALUE_USD + totalSaleValueUnlockedUsd,
      totalImplementationCostUsd,
      totalImplementationHours,
      implementedCount,
      partialCount,
      pendingCount,
      completionPercent,
    },
  };
}
