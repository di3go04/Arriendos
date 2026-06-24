import { supabase } from '@/lib/supabase';
import { Payment } from '@/types';
import { useEffect } from 'react';

/**
 * Hook to subscribe to real‑time changes on the `payments` table.
 * When a new payment is inserted, updated, or deleted, the provided
 * `onChange` callback receives the latest list of payments for the
 * current user/role.
 */
export function usePaymentsRealtime(
  userId: string | undefined,
  role: string | undefined,
  setPayments: (payments: Payment[]) => void
) {
  useEffect(() => {
    if (!userId || !role) return;

    // Build base query for the channel based on role
    const channel = supabase.channel('public:payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        async () => {
          // Refetch payments after any change to keep UI in sync
          try {
            let query = supabase.from('payments').select('*').order('due_date', { ascending: false });
            if (role === 'arrendatario') {
              query = query.eq('tenant_id', userId);
            } else {
              // landlord or admin: fetch contracts first to limit by landlord
              const { data: contracts } = await supabase
                .from('contracts')
                .select('id')
                .eq('landlord_id', userId);
              const contractIds = (contracts || []).map((c) => c.id);
              if (contractIds.length > 0) {
                query = query.in('contract_id', contractIds);
              } else {
                // No contracts, clear list
                setPayments([]);
                return;
              }
            }
            const { data, error } = await query;
            if (error) throw error;
            setPayments(data as Payment[]);
          } catch (e) {
            console.error('Realtime payments fetch error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role, setPayments]);
}
