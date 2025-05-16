import { getResellersFromDb } from '@/lib/data-service';
import { ResellersList } from '@/components/admin/resellers-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResellersPage() {
  const resellers = await getResellersFromDb();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Resellers Management</h1>
      <ResellersList resellers={resellers} />
    </div>
  );
} 