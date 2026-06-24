/** Módulo 18 — reexporta lógica de reportes financieros */
export function buildFinancialExportUrl(year: number, propertyId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (propertyId) params.set('propertyId', propertyId);
  return `/api/reports/export-excel?${params.toString()}`;
}

export async function fetchFinancialSummary(year: number, propertyId?: string) {
  const params = new URLSearchParams({ year: String(year) });
  if (propertyId) params.set('propertyId', propertyId);
  const res = await fetch(`/api/reports/financial?${params}`);
  return res.json();
}
