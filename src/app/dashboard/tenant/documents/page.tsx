'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Download, FileCheck, FileText, Loader2, ShieldCheck, Calendar, Globe, Cpu, Key, FileSignature, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SignatureModal from '@/components/contracts/SignatureModal';

interface PaymentWithDetails {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  paid: boolean;
  month_year: string | null;
  contract?: {
    contract_number: string | null;
    property?: { title: string };
  };
}

interface ContractAuditDetail {
  id: string;
  contract_number: string | null;
  status: string;
  monthly_rent: number;
  start_date: string | null;
  contract_content: string | null;
  property?: { title: string; address: string; city: string };
  signed_by_tenant: boolean;
  tenant_signed_at: string | null;
  signed_by_landlord: boolean;
  landlord_signed_at: string | null;
  audit_logs?: {
    id: string;
    signer_role: string;
    ip_address: string | null;
    user_agent: string | null;
    content_hash: string;
    signed_at: string;
  }[];
}

export default function TenantDocumentsPage() {
  const t = useTranslations('TENANT_DOCUMENTS_PAGE');
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [contracts, setContracts] = useState<ContractAuditDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recibos' | 'auditoria'>('recibos');
  
  // Signature Modal states
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractAuditDetail | null>(null);

  const fetchDocsAndContracts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Receipts
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select('*, contract:contracts!inner(contract_number, property:properties(title))')
        .eq('tenant_id', user.id)
        .eq('paid', true)
        .order('paid_at', { ascending: false });
      
      if (!paymentsErr) setPayments(paymentsData || []);

      // Fetch Contracts with Property info
      const { data: contractsData, error: contractsErr } = await supabase
        .from('contracts')
        .select('*, property:properties(title, address, city)')
        .eq('tenant_id', user.id)
        .order('created_at', { ascending: false });

      if (!contractsErr && contractsData) {
        // For each contract, fetch signature audits if they exist
        const enrichedContracts = await Promise.all(
          contractsData.map(async (c: ContractAuditDetail) => {
            const { data: audits } = await supabase
              .from('contract_signature_audit')
              .select('*')
              .eq('contract_id', c.id)
              .order('signed_at', { ascending: true });
            
            return {
              ...c,
              audit_logs: audits || []
            };
          })
        );
        setContracts(enrichedContracts);
      }
    } catch (err) {
      console.error('Error fetching receipts or contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocsAndContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">{t('loading_message')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tenant" className="p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {t('page_title')}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">{t('page_subtitle')}</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-muted p-1 rounded-2xl gap-1 border border-border">
          <button
            onClick={() => setActiveTab('recibos')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'recibos'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('tab_receipts', { count: payments.length })}
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('tab_signatures', { count: contracts.length })}
          </button>
        </div>
      </div>

      {activeTab === 'recibos' ? (
        // Receipts List
        payments.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-card border border-border rounded-3xl p-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-75" />
            <div>
              <p className="font-extrabold text-foreground text-base">{t('empty_receipts_title')}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                {t('empty_receipts_desc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-foreground text-sm">
                      {t('receipt_prefix')} - {p.contract?.property?.title || t('property_fallback')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      {p.month_year || format(parseISO(p.due_date), 'MMMM yyyy', { locale: es })} &middot;
                      ${Number(p.amount).toLocaleString('es-CO')} COP
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/tenant/receipts?paymentId=${p.id}`}
                  download
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-95 transition-all shadow-sm shadow-primary/15"
                >
                  <Download className="w-4 h-4" />
                  {t('download_pdf')}
                </a>
              </div>
            ))}
          </div>
        )
      ) : (
        // Audit Logs (Signed Contracts)
        contracts.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-card border border-border rounded-3xl p-8">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto opacity-75" />
            <div>
              <p className="font-extrabold text-foreground text-base">{t('empty_contracts_title')}</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1 leading-relaxed">
                {t('empty_contracts_desc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
                {/* Contract Meta */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-foreground">
                        {c.property?.title || t('contract_fallback')}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'activo' || c.status === 'firmado'
                          ? 'bg-success/15 border-success/30 text-success'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      {t('address_label')}: {c.property?.address}, {c.property?.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {!c.signed_by_tenant && (
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setIsSignModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer border-none"
                      >
                        <FileSignature className="w-4 h-4" />
                        {t('sign_contract')}
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/contracts/${c.id}`)}
                      className="px-4 py-2 bg-muted hover:bg-border border border-border text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {t('view_details')}
                    </button>
                  </div>
                </div>

                {/* Audit Trail Timeline */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-primary">
                    <ShieldCheck className="w-4 h-4" />
                    {t('audit_trail_title')}
                  </h5>

                  {c.audit_logs && c.audit_logs.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {c.audit_logs.map((log) => (
                        <div key={log.id} className="bg-muted/40 border border-border rounded-2xl p-4 space-y-3 relative overflow-hidden">
                          {/* Accent */}
                          <div className="absolute top-0 right-0 p-2.5 bg-primary/10 rounded-bl-xl border-l border-b border-primary/20 text-primary flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            {t('verified_badge')}
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[10px] text-muted-foreground font-bold uppercase">{t('signer_label')}</span>
                            <span className="block text-xs font-bold text-foreground">
                              {log.signer_role === 'tenant' ? t('signer_tenant') : t('signer_landlord')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-ink-muted">
                            <div className="space-y-0.5">
                              <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="w-3.5 h-3.5 text-primary" /> {t('signature_date_label')}</span>
                              <span className="text-foreground block">{format(parseISO(log.signed_at), 'dd MMM yyyy, hh:mm a', { locale: es })}</span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="flex items-center gap-1 text-muted-foreground"><Globe className="w-3.5 h-3.5 text-primary" /> {t('ip_address_label')}</span>
                              <span className="text-foreground block font-mono">{log.ip_address || '127.0.0.1'}</span>
                            </div>
                            <div className="col-span-2 space-y-0.5">
                              <span className="flex items-center gap-1 text-muted-foreground"><Cpu className="w-3.5 h-3.5 text-primary" /> {t('device_label')}</span>
                              <span className="text-foreground block truncate" title={log.user_agent || ''}>{log.user_agent || 'Mozilla/5.0'}</span>
                            </div>
                            <div className="col-span-2 space-y-0.5 pt-1.5 border-t border-border">
                              <span className="flex items-center gap-1 text-muted-foreground"><Key className="w-3.5 h-3.5 text-primary" /> {t('hash_label')}</span>
                              <span className="text-primary block font-mono text-[9px] break-all leading-normal select-all bg-primary/5 p-1.5 rounded-lg border border-primary/10">
                                {log.content_hash}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-medium italic py-2">
                      {t('no_signatures_yet')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Signature Modal */}
      {selectedContract && (
        <SignatureModal
          isOpen={isSignModalOpen}
          onClose={() => {
            setIsSignModalOpen(false);
            setSelectedContract(null);
            fetchDocsAndContracts();
          }}
          contractId={selectedContract.id}
          contractTitle={selectedContract.property?.title || 'Contrato'}
          contractContent={selectedContract.contract_content || ''}
          onSignedSuccess={() => {
            fetchDocsAndContracts();
          }}
        />
      )}
    </div>
  );
}
