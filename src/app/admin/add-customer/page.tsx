import { getPlansFromDb } from '@/lib/data-service';
import { AdminAddCustomerForm } from '@/components/admin/admin-add-customer-form';

export default async function AddCustomerPage() {
  const plans = await getPlansFromDb();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
      </div>
      <AdminAddCustomerForm plans={plans} />
    </div>
  );
} 