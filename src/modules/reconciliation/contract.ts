export interface BankAccount {
  id: string;
  organizationId: string;
  institution: string;
  accountNumberLast4: string;
  accountName: string;
  belvoLinkId: string;
  lastSyncedAt: string | null;
  status: 'active' | 'error' | 'disconnected';
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  externalId: string;
  amount: number;
  description: string;
  transactionDate: string;
  type: 'credit' | 'debit';
  reference: string | null;
}

export interface ReconciliationMatch {
  id: string;
  bankTransactionId: string;
  paymentId: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  matchedAt: string;
}

export interface IReconciliationService {
  registerBankAccount(orgId: string, institution: string, accountNumber: string, accountName: string, belvoLinkId: string): Promise<{ ok: true; data: BankAccount } | { ok: false; error: string }>;
  syncTransactions(bankAccountId: string): Promise<{ ok: boolean; synced: number }>;
  matchPayments(bankAccountId: string): Promise<ReconciliationMatch[]>;
  confirmMatch(matchId: string): Promise<void>;
}
