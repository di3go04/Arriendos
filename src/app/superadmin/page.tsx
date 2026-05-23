import { SuperAdminDashboard } from '@/components/modules/SuperAdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin | RentNow',
};

export default function SuperAdminPortal() {
  return <SuperAdminDashboard />;
}
