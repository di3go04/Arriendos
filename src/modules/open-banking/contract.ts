export interface OpenBankingLinkResult {
  linkId: string;
  widgetUrl: string;
}

export interface BelvoAccount {
  id: string;
  institution: string;
  type: string;
  name: string;
  balance: { current: number; available: number };
}

export interface BelvoTransaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: string;
}

export interface SolvencyScore {
  userId: string;
  status: 'approved' | 'rejected' | 'pending_review';
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  debtToIncomeRatio: number;
  maxRecommendedRent: number;
  confidence: number;
  evaluatedAt: string;
  linkId: string;
}

export interface IOpenBankingService {
  createLink(userId: string): Promise<{ ok: true; data: OpenBankingLinkResult } | { ok: false; error: string }>;
  processWebhook(payload: unknown): Promise<{ ok: boolean; linkId?: string }>;
  evaluateSolvency(userId: string, linkId: string): Promise<{ ok: true; data: SolvencyScore } | { ok: false; error: string }>;
  getSolvencyStatus(userId: string): Promise<SolvencyScore | null>;
}
