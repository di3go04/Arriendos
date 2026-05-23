export {
  PREMIUM_IMPROVEMENTS,
  BASE_SALE_VALUE_USD,
  getImprovementById,
  type PremiumImprovementDefinition,
  type PremiumImprovementId,
} from './registry';
export { detectAllImprovementStatuses, mergeStatusWithDefinitions, type ImprovementStatusResult } from './detector';
export { computePremiumValuation, type PremiumValuationSummary } from './valuation';
