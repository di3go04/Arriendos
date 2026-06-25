import { getSupabaseAdmin } from '@/modules/_kernel/supabase-admin';
import { createDashboardAlertsService } from './service';

export async function runAlertWorker() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error('[dashboard-alerts] Admin no configurado');
    return;
  }

  const { data: users } = await admin.from('profiles').select('id');
  if (!users?.length) return;

  const svc = createDashboardAlertsService();

  for (const user of users) {
    try {
      const alerts = await svc.evaluateAlerts(user.id);

      for (const alert of alerts) {
        if (alert.severity === 'high' || alert.severity === 'critical') {
          await svc.sendAlertNotification(alert);
        }
      }

      if (alerts.length > 0) {
        console.log(`[dashboard-alerts] ${user.id}: ${alerts.length} alertas generadas`);
      }
    } catch (err) {
      console.error(`[dashboard-alerts] Error procesando usuario ${user.id}:`, err);
    }
  }
}

if (require.main === module) {
  runAlertWorker()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
