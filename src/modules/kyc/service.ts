import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { withDemoFallback } from '@/lib/demo-fallbacks';
import { getDemoKycResult } from '@/lib/demo-fallbacks';
import type { IKycService, KycDocument, KycStatus, KycVerificationResult } from './contract';

const BELVO_KYC_URL = process.env.BELVO_API_URL || 'https://api.belvo.com';
const BELVO_SECRET_ID = process.env.BELVO_SECRET_ID || '';
const BELVO_SECRET_PASSWORD = process.env.BELVO_SECRET_PASSWORD || '';

function basicAuth(): string {
  return Buffer.from(`${BELVO_SECRET_ID}:${BELVO_SECRET_PASSWORD}`).toString('base64');
}

async function belvoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BELVO_KYC_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth()}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Belvo KYC API error ${res.status}: ${body}`);
  }
  return res.json();
}

function mapRow(row: any): KycDocument {
  return {
    id: row.id,
    userId: row.user_id,
    documentType: row.document_type,
    documentNumber: row.document_number || '',
    documentUrl: row.document_url,
    selfieUrl: row.selfie_url,
    status: row.status,
    confidence: row.confidence || 0,
    faceMatchScore: row.face_match_score || 0,
    ocrData: row.ocr_data || {},
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at,
    providerVerificationId: row.provider_verification_id,
    createdAt: row.created_at,
  };
}

export function createKycService(): IKycService {
  const db = () => getSupabaseAdmin();

  return {
    async uploadDocument(userId: string, documentType: string, documentBase64: string, selfieBase64: string) {
      return withDemoFallback(async () => {
        const admin = db();
        if (!admin) return { ok: false, status: 'pending', confidence: 0, faceMatchScore: 0, documentNumber: '', fullName: '', error: 'Admin no configurado' };

        try {
          if (BELVO_SECRET_ID && BELVO_SECRET_PASSWORD) {
            const belvoResult = await belvoFetch<any>('/api/v1/kyc/documents/', {
              method: 'POST',
              body: JSON.stringify({
                document_type: documentType === 'national_id' ? 'CC' : documentType === 'passport' ? 'PASSPORT' : 'DRIVERS_LICENSE',
                document: documentBase64,
                selfie: selfieBase64,
              }),
            });

            const confidence = belvoResult.confidence || belvoResult.score || 0;
            const faceMatch = belvoResult.face_match_score || belvoResult.liveness_score || 0;
            const status: KycStatus = confidence > 0.8 && faceMatch > 0.7 ? 'verified' : 'rejected';

            const result: KycVerificationResult = {
              ok: status === 'verified',
              status,
              confidence,
              faceMatchScore: faceMatch,
              documentNumber: belvoResult.document_number || '',
              fullName: belvoResult.full_name || '',
            };

            await admin.from('kyc_documents').insert({
              user_id: userId,
              document_type: documentType,
              document_number: result.documentNumber,
              document_url: `kyc://${userId}/${documentType}/document`,
              selfie_url: `kyc://${userId}/${documentType}/selfie`,
              status: result.status,
              confidence: result.confidence,
              face_match_score: result.faceMatchScore,
              ocr_data: belvoResult,
              provider_verification_id: belvoResult.id || null,
              verified_at: status === 'verified' ? new Date().toISOString() : null,
            });

            return result;
          }

          const demo = getDemoKycResult();
          await admin.from('kyc_documents').insert({
            user_id: userId,
            document_type: documentType,
            document_number: demo.documentNumber,
            document_url: `kyc://${userId}/${documentType}/document`,
            selfie_url: `kyc://${userId}/${documentType}/selfie`,
            status: 'verified',
            confidence: demo.confidence,
            face_match_score: demo.faceMatchScore,
            ocr_data: { simulated: true },
            provider_verification_id: null,
            verified_at: new Date().toISOString(),
          });

          return demo;
        } catch (err) {
          return {
            ok: false,
            status: 'rejected',
            confidence: 0,
            faceMatchScore: 0,
            documentNumber: '',
            fullName: '',
            error: err instanceof Error ? err.message : 'Error en verificación KYC',
          };
        }
      }, getDemoKycResult);
    },

    async processWebhook(payload: any) {
      const admin = db();
      if (!admin) return;
      if (payload?.event === 'kyc_verification_completed' && payload?.verification_id) {
        const status: KycStatus = payload.status === 'success' ? 'verified' : 'rejected';
        await admin.from('kyc_documents').update({
          status,
          confidence: payload.confidence || 0,
          face_match_score: payload.face_match_score || 0,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
        }).eq('provider_verification_id', payload.verification_id);
      }
    },

    async getKycStatus(userId: string) {
      const admin = db();
      if (!admin) return null;
      const { data } = await admin.from('kyc_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data ? mapRow(data) : null;
    },
  };
}
