import type { AlertThreshold } from './contract';

export const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { metric: 'delinquencyRate', operator: 'gt', value: 15, severity: 'high', message: 'Morosidad superior al 15%. Revisar estrategia de cobranza.' },
  { metric: 'delinquencyRate', operator: 'gt', value: 25, severity: 'critical', message: 'Morosidad crítica superior al 25%. Activar cobranza intensiva.' },
  { metric: 'occupancyRate', operator: 'lt', value: 70, severity: 'high', message: 'Ocupación menor al 70%. Activar marketing de propiedades.' },
  { metric: 'occupancyRate', operator: 'lt', value: 50, severity: 'critical', message: 'Ocupación menor al 50% — revisar pricing y estrategia.' },
  { metric: 'cashflowMonth', operator: 'lt', value: 0, severity: 'critical', message: 'Flujo de caja mensual negativo. Revisar gastos e ingresos.' },
  { metric: 'collectionEfficiency', operator: 'lt', value: 80, severity: 'medium', message: 'Eficiencia de cobranza inferior al 80%. Optimizar procesos.' },
  { metric: 'collectionEfficiency', operator: 'lt', value: 60, severity: 'high', message: 'Eficiencia de cobranza crítica (<60%).' },
  { metric: 'mrr', operator: 'lt', value: 0, severity: 'critical', message: 'MRR en cero. Sin ingresos recurrentes.' },
  { metric: 'pendingMaintenance', operator: 'gt', value: 10, severity: 'medium', message: 'Más de 10 mantenimientos pendientes. Asignar proveedores.' },
];

export function evaluateThresholds(metrics: Record<string, number>): AlertThreshold[] {
  return DEFAULT_THRESHOLDS.filter(t => {
    const metricValue = metrics[t.metric];
    if (metricValue === undefined) return false;
    switch (t.operator) {
      case 'gt': return metricValue > t.value;
      case 'lt': return metricValue < t.value;
      case 'gte': return metricValue >= t.value;
      case 'lte': return metricValue <= t.value;
      case 'eq': return metricValue === t.value;
      default: return false;
    }
  });
}
