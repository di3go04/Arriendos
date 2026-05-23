'use client';

import SkeletonLoader from '@/components/ui/SkeletonLoader';

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <SkeletonLoader />
    </div>
  );
}
