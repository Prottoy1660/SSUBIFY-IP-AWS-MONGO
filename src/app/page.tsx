
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LOGIN_PATH, ADMIN_DASHBOARD_PATH, RESELLER_DASHBOARD_PATH } from '@/lib/constants';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  if (user.role === 'admin') {
    redirect(ADMIN_DASHBOARD_PATH);
  } else if (user.role === 'reseller') {
    redirect(RESELLER_DASHBOARD_PATH);
  } else {
    // Fallback, though should not happen with defined roles
    redirect(LOGIN_PATH);
  }

  // This return is technically unreachable due to redirects but required by Next.js
  return null;
}
