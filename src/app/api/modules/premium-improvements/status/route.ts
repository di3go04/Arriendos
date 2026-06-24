import { NextResponse } from 'next/server';

export async function GET() {
  const { computePremiumValuation } = await import('@/modules/premium-improvements');
  const { items, summary } = computePremiumValuation();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary,
    items: items.map((item) => ({
      id: item.id,
      order: item.order,
      title: item.title,
      description: item.description,
      modulePath: item.modulePath,
      apiEvidence: item.apiEvidence,
      status: item.status,
      checks: item.checks,
      saleValueAddedUsd: item.saleValueAddedUsd,
      saleValueUnlockedUsd: item.saleValueUnlockedUsd,
      implementationCostUsd: item.implementationCostUsd,
      implementationHours: item.implementationHours,
    })),
  });
}
