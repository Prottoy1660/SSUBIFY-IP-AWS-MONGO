'use client';

import dynamic from 'next/dynamic';
import type { Submission, User } from '@/types';

const AdminDashboardClient = dynamic(
  () => import('./dashboard-client').then(mod => mod.AdminDashboardClient),
  { ssr: false }
);

interface DashboardWrapperProps {
  submissions: Submission[];
  resellers: User[];
}

export function AdminDashboardWrapper({ submissions, resellers }: DashboardWrapperProps) {
  return <AdminDashboardClient submissions={submissions} resellers={resellers} />;
} 