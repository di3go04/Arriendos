export type KycStatus = 'pending' | 'in_progress' | 'verified' | 'rejected' | 'expired';

export interface KycDocument {
  id: string;
  userId: string;
  documentType: 'national_id' | 'passport' | 'driver_license';
  documentNumber: string;
  documentUrl: string;
  selfieUrl: string;
  status: KycStatus;
  confidence: number;
  faceMatchScore: number;
  ocrData: Record<string, string>;
  verifiedAt: string | null;
  expiresAt: string | null;
  providerVerificationId: string | null;
  createdAt: string;
}

export interface KycVerificationResult {
  ok: boolean;
  status: KycStatus;
  confidence: number;
  faceMatchScore: number;
  documentNumber: string;
  fullName: string;
  error?: string;
}

export interface IKycService {
  uploadDocument(userId: string, documentType: string, documentBase64: string, selfieBase64: string): Promise<KycVerificationResult>;
  processWebhook(payload: any): Promise<void>;
  getKycStatus(userId: string): Promise<KycDocument | null>;
}
