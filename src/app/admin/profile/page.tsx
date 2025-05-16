import { AdminProfileForm } from '@/components/admin/admin-profile-form';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <AdminProfileForm user={user} />
    </div>
  );
} 