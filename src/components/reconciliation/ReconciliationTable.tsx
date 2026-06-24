'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Banknote } from 'lucide-react';

interface Match {
  id: string;
  bankTransactionId: string;
  paymentId: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  matchedAt: string;
}

interface BankAccount {
  id: string;
  institution: string;
  accountNumberLast4: string;
  lastSyncedAt: string | null;
  status: string;
}

export function ReconciliationTable() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAccounts = async () => {
    const res = await fetch('/api/modules/reconciliation/bank-accounts');
    const data = await res.json();
    if (data.ok) setAccounts(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(fetchAccounts, 0);
    return () => clearTimeout(id);
  }, []);

  const fetchMatches = async (accountId: string) => {
    setSelectedAccount(accountId);
    const res = await fetch(`/api/modules/reconciliation/match?bankAccountId=${accountId}`);
    const data = await res.json();
    if (data.ok) setMatches(data.data || []);
  };

  const confirmMatch = async (matchId: string) => {
    await fetch('/api/modules/reconciliation/match', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId }),
    });
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'confirmed' as const } : m));
  };

  const syncAccount = async (accountId: string) => {
    setSyncing(true);
    await fetch(`/api/modules/reconciliation/sync?bankAccountId=${accountId}`, { method: 'POST' });
    await fetchMatches(accountId);
    setSyncing(false);
  };

  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />;

  if (!accounts.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center">
        <Banknote className="h-10 w-10 text-zinc-300" />
        <div>
          <p className="font-medium">Sin cuentas bancarias vinculadas</p>
          <p className="text-sm text-zinc-500">Conecta una cuenta bancaria para conciliar pagos automáticamente</p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Vincular cuenta bancaria
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {accounts.map(acc => (
          <button
            key={acc.id}
            onClick={() => fetchMatches(acc.id)}
            className={`flex-shrink-0 rounded-lg border px-4 py-2 text-left text-sm transition ${
              selectedAccount === acc.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <p className="font-medium">{acc.institution}</p>
            <p className="text-xs text-zinc-500">**** {acc.accountNumberLast4}</p>
          </button>
        ))}
      </div>

      {selectedAccount && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {matches.filter(m => m.status === 'pending').length} conciliaciones pendientes
            </h3>
            <button
              onClick={() => syncAccount(selectedAccount)}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>

          {matches.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-400">Todos los pagos están conciliados ✅</p>
          ) : (
            <div className="space-y-2">
              {matches.map(m => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                    m.status === 'confirmed' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' :
                    m.status === 'rejected' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                    'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.status === 'confirmed' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                     m.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-500" /> :
                     <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    <div>
                      <p className="font-medium">Pago #{m.paymentId.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500">Confianza: {Math.round(m.confidence * 100)}%</p>
                    </div>
                  </div>
                  {m.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => confirmMatch(m.id)} className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                        Confirmar
                      </button>
                      <button className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200">
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
