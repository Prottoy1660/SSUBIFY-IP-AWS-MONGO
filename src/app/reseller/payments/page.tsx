import { PaymentRequests } from '@/components/reseller/payment-requests';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ResellerPaymentsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'reseller') {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Payment Requests</h1>
      <PaymentRequests resellerId={user.id} />
    </div>
  );
} 