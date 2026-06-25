'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, Building, DollarSign, Loader2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Metrics {
  properties: number;
  contracts: number;
  leads: number;
}

export function SuperAdminDashboard() {
  const t = useTranslations('super_admin');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [orgs, setOrgs] = useState<LooseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [mRes, oRes] = await Promise.all([
        fetch('/api/modules/superadmin-tenant/metrics'),
        fetch('/api/modules/superadmin-tenant/organizations'),
      ]);
      const mJson = await mRes.json();
      const oJson = await oRes.json();
      if (mJson.ok) setMetrics(mJson.data);
      if (oJson.ok) setOrgs(oJson.data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-neutral-500 mt-1">{t('subtitle')}</p>
          </div>
          <Link href="/admin/readiness" className="text-sm font-bold text-primary underline">
            {t('readiness')}
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard icon={Building} label={t('properties')} value={metrics?.properties ?? 0} />
          <MetricCard icon={Users} label={t('contracts')} value={metrics?.contracts ?? 0} />
          <MetricCard icon={Activity} label={t('leads')} value={metrics?.leads ?? 0} />
        </div>

        <section className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> {t('organizations')}
          </h2>
          {orgs.length === 0 ? (
            <p className="text-sm text-neutral-500">{t('no_organizations')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">{t('name')}</th>
                    <th>{t('plan')}</th>
                    <th>{t('max_properties')}</th>
                    <th>{t('max_users')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.id as string} className="border-b border-neutral-100">
                      <td className="py-2 font-medium">{o.name as string}</td>
                      <td>{o.plan as string}</td>
                      <td>{o.max_properties as number}</td>
                      <td>{o.max_users as number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border">
      <Icon className="w-6 h-6 text-primary mb-3" />
      <p className="text-neutral-500 text-sm">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
