import dynamic from 'next/dynamic';

/** Módulo 12 — lazy loading de vistas pesadas */
export const LazyLandlordDashboard = dynamic(
  () => import('@/app/dashboard/landlord/page'),
  { loading: () => null, ssr: false }
);

export const LazyExpensesPage = dynamic(
  () => import('@/app/dashboard/expenses/page'),
  { loading: () => null }
);
