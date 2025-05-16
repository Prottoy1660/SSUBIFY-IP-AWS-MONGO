import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Subify',
  description: 'Manage all reseller customer submissions.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 