import type React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LOGIN_PATH } from '@/lib/constants';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect(LOGIN_PATH); 
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}

