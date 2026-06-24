import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import type { AlertEvent, DashboardMetrics, IDashboardAlertsService } from './contract';
import { evaluateThresholds } from './thresholds';

function buildMetrics(data: any): DashboardMetrics {
  return {
    roi: Number(data.roi) || 0,
    cashflowMonth: Number(data.cashflow_month) || 0,
    cashflowYear: Number(data.cashflow_year) || 0,
    delinquencyRate: Number(data.delinquency_rate) || 0,
    occupancyRate: Number(data.occupancy_rate) || 0,
    mrr: Number(data.mrr) || 0,
    arr: Number(data.arr) || 0,
    collectionEfficiency: Number(data.collection_efficiency) || 0,
    activeContracts: Number(data.active_contracts) || 0,
    totalProperties: Number(data.total_properties) || 0,
    totalTenants: Number(data.total_tenants) || 0,
    pendingMaintenance: Number(data.pending_maintenance) || 0,
    avgMonthlyIncome: Number(data.avg_monthly_income) || 0,
    projectedAnnualIncome: Number(data.projected_annual_income) || 0,
  };
}

export function createDashboardAlertsService(): IDashboardAlertsService {
  const db = () => getSupabaseAdmin();

  return {
    async getMetrics(userId: string) {
      const admin = db();
      if (!admin) {
        return {
          roi: 0, cashflowMonth: 0, cashflowYear: 0, delinquencyRate: 0, occupancyRate: 0,
          mrr: 0, arr: 0, collectionEfficiency: 0, activeContracts: 0, totalProperties: 0,
          totalTenants: 0, pendingMaintenance: 0, avgMonthlyIncome: 0, projectedAnnualIncome: 0,
        };
      }

      const [contractsRes, paymentsRes, propsRes, maintenanceRes] = await Promise.all([
        admin.from('contracts').select('id, monthly_rent, status, start_date, end_date').eq('landlord_id', userId),
        admin.from('payments').select('amount, paid, due_date, paid_at, contract_id'),
        admin.from('properties').select('id, monthly_rent, status').eq('owner_id', userId),
        admin.from('service_requests').select('id, status').eq('landlord_id', userId),
      ]);

      const contracts = contractsRes.data || [];
      const payments = paymentsRes.data || [];
      const properties = propsRes.data || [];
      const maintenance = maintenanceRes.data || [];

      const activeContracts = (contracts || []).filter(c => c.status === 'activo' || c.status === 'firmado').length;
      const totalProperties = (properties || []).length;
      const occupiedProperties = (properties || []).filter(p => p.status === 'ocupado').length;
      const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
      const pendingMaintenance = (maintenance || []).filter(m => m.status === 'pendiente' || m.status === 'abierto').length;

      const paid = payments.filter(p => p.paid).reduce((s, p) => s + Number(p.amount), 0);
      const totalBilled = payments.reduce((s, p) => s + Number(p.amount), 0);
      const collectionEfficiency = totalBilled > 0 ? (paid / totalBilled) * 100 : 0;

      const overdue = payments.filter(p => !p.paid && p.due_date && new Date(p.due_date) < new Date());
      const totalDue = overdue.reduce((s, p) => s + Number(p.amount), 0);
      const delinquencyRate = totalBilled > 0 ? (totalDue / totalBilled) * 100 : 0;

      const firstContract = (contracts || [])[0];
      const monthlyRentSum = activeContracts * Number(firstContract?.monthly_rent || 0);
      const mrr = Number(monthlyRentSum);
      const arr = mrr * 12;
      const avgMonthlyIncome = paid / Math.max(1, 12);
      const cashflowMonth = paid - (totalBilled - paid);
      const cashflowYear = cashflowMonth * 12;
      const projectedAnnualIncome = avgMonthlyIncome * 12 * (collectionEfficiency / 100);
      const totalInvestment = (properties || []).reduce((s, p) => s + Number(p.monthly_rent || 0) * 12, 0);
      const roi = totalInvestment > 0 ? ((paid - totalInvestment) / totalInvestment) * 100 : 0;

      const result = {
        roi: Math.round(roi * 100) / 100,
        cashflowMonth: Math.round(cashflowMonth),
        cashflowYear: Math.round(cashflowYear),
        delinquencyRate: Math.round(delinquencyRate * 100) / 100,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        mrr: Math.round(mrr),
        arr: Math.round(arr),
        collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
        activeContracts,
        totalProperties,
        totalTenants: (contracts as any[]).filter((c: any) => c.tenant_id).length,
        pendingMaintenance,
        avgMonthlyIncome: Math.round(avgMonthlyIncome),
        projectedAnnualIncome: Math.round(projectedAnnualIncome),
      };

      const adminDb = admin;
      await adminDb.from('dashboard_metrics_cache').upsert({
        user_id: userId,
        ...result,
        computed_at: new Date().toISOString(),
      });

      return buildMetrics(result);
    },

    async evaluateAlerts(userId: string) {
      const metrics = await this.getMetrics(userId);
      const triggered = evaluateThresholds(metrics as any);

      const admin = db();
      if (!admin) return [];

      const events: AlertEvent[] = [];

      for (const t of triggered) {
        const { data, error } = await admin.from('dashboard_alerts').insert({
          user_id: userId,
          type: `threshold_${t.metric}`,
          severity: t.severity,
          title: `Alerta: ${t.metric.replace(/([A-Z])/g, ' $1').trim()}`,
          message: t.message,
          metric: t.metric,
          value: (metrics as any)[t.metric] || 0,
          threshold: t.value,
          read: false,
        }).select().single();

        if (data && !error) {
          events.push({
            id: data.id,
            userId: data.user_id,
            type: data.type,
            severity: data.severity,
            title: data.title,
            message: data.message,
            metric: data.metric,
            value: data.value,
            threshold: data.threshold,
            read: data.read,
            createdAt: data.created_at,
          });
        }
      }

      return events;
    },

    async getActiveAlerts(userId: string) {
      const admin = db();
      if (!admin) return [];
      const { data } = await admin
        .from('dashboard_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        type: d.type,
        severity: d.severity,
        title: d.title,
        message: d.message,
        metric: d.metric,
        value: d.value,
        threshold: d.threshold,
        read: d.read,
        createdAt: d.created_at,
      }));
    },

    async markAlertRead(alertId: string, userId: string) {
      const admin = db();
      if (!admin) return;
      await admin.from('dashboard_alerts').update({ read: true }).eq('id', alertId).eq('user_id', userId);
    },

    async sendAlertNotification(alert: AlertEvent) {
      const admin = db();
      if (!admin) return;

      await admin.from('notifications').insert({
        user_id: alert.userId,
        title: alert.title,
        message: alert.message,
        type: alert.severity === 'critical' ? 'error' : 'warning',
      });

      const { data: user } = await admin.from('profiles').select('phone').eq('id', alert.userId).single();
      if (user?.phone) {
        try {
          const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL;
          if (bridgeUrl) {
            await fetch(`${bridgeUrl}/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.phone,
                message: `🚨 *${alert.title}*\n${alert.message}\nValor actual: ${alert.value} | Umbral: ${alert.threshold}`,
              }),
            });
          }
        } catch { /* WhatsApp notification best-effort */ }
      }
    },
  };
}
