'use client';

import dynamic from 'next/dynamic';
import type { Submission } from '@/types';

const ResellerDashboardClient = dynamic(
  () => import('./dashboard-client').then(mod => mod.ResellerDashboardClient),
  { ssr: false }
);

interface DashboardWrapperProps {
  submissions: Submission[];
}

export function ResellerDashboardWrapper({ submissions }: DashboardWrapperProps) {
  return <ResellerDashboardClient submissions={submissions} />;
} 