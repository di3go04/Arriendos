export interface VoiceCallRequest {
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  propertyId: string;
  contractId: string;
  debtAmount: number;
  daysOverdue: number;
  dueDate: string;
}

export interface PaymentCommitment {
  id: string;
  contractId: string;
  tenantId: string;
  promisedAmount: number;
  promisedDate: string;
  status: 'pending' | 'fulfilled' | 'breached';
  callSid: string | null;
  callTranscript: string | null;
  intentDetected: string;
  notes: string;
  createdAt: string;
}

export interface VoiceCallResult {
  ok: boolean;
  callSid: string;
  status: string;
  commitment?: PaymentCommitment;
  error?: string;
}

export interface IVoiceAgentsService {
  initiateCollectionCall(request: VoiceCallRequest): Promise<VoiceCallResult>;
  processCallCompletion(callSid: string, transcript: string, intent: string): Promise<PaymentCommitment | null>;
  registerCommitment(contractId: string, tenantId: string, amount: number, promisedDate: string, intent: string): Promise<PaymentCommitment>;
  getPendingCommitments(tenantId: string): Promise<PaymentCommitment[]>;
  getCollectionScript(): string;
}
