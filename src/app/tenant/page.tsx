import { Home, Receipt, AlertCircle, Wrench } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('tenant_portal');
  return { title: t('metadata_title') };
}

export default async function TenantPortal() {
  const t = await getTranslations('tenant_portal');
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t('title')}</h1>
        <p className="text-neutral-500 mt-2">{t('subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="font-semibold mb-1">{t('my_property')}</h3>
          <p className="text-sm text-neutral-500">{t('property_demo')}</p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center text-danger mb-4">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-semibold mb-1">{t('pending_payments')}</h3>
          <p className="text-xl font-bold mt-1">$450.00 <span className="text-xs font-normal text-danger">{t('overdue')}</span></p>
          <button className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover transition-colors">
            {t('pay_now')}
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center text-warning mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-semibold mb-1">{t('active_contract')}</h3>
          <p className="text-sm text-neutral-500">{t('expires', { date: '12 Nov 2026' })}</p>
          <button className="mt-4 text-primary text-sm hover:underline">{t('view_pdf')}</button>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="font-semibold mb-1">{t('maintenance')}</h3>
          <p className="text-sm text-neutral-500">{t('open_tickets', { count: 0 })}</p>
          <button className="mt-4 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            {t('report_problem')}
          </button>
        </div>
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t('payment_history')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500">
                <th className="pb-3 font-medium">{t('date')}</th>
                <th className="pb-3 font-medium">{t('concept')}</th>
                <th className="pb-3 font-medium">{t('amount')}</th>
                <th className="pb-3 font-medium">{t('status')}</th>
                <th className="pb-3 font-medium text-right">{t('receipt')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
                <td className="py-3">12 Abril 2026</td>
                <td className="py-3">{t('monthly_rent')}</td>
                <td className="py-3">$450.00</td>
                <td className="py-3"><span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">{t('paid')}</span></td>
                <td className="py-3 text-right"><button className="text-primary hover:underline">{t('download')}</button></td>
              </tr>
              <tr>
                <td className="py-3">12 Marzo 2026</td>
                <td className="py-3">{t('monthly_rent')}</td>
                <td className="py-3">$450.00</td>
                <td className="py-3"><span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">{t('paid')}</span></td>
                <td className="py-3 text-right"><button className="text-primary hover:underline">{t('download')}</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
