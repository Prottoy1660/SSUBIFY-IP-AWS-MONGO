import { notFound } from 'next/navigation';
import { getResellerById, getSubmissionsByResellerId } from '@/lib/data-service';
import { ResellerProfile } from '../../../../components/admin/reseller-profile';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ResellerPageProps {
  params: {
    id: string;
  };
}

export default async function ResellerPage({ params }: ResellerPageProps) {
  try {
    const [reseller, submissions] = await Promise.all([
      getResellerById(params.id),
      getSubmissionsByResellerId(params.id),
    ]);

    if (!reseller) {
      notFound();
    }

    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Reseller Profile</h1>
        <Suspense fallback={<div>Loading reseller profile...</div>}>
          <ResellerProfile reseller={reseller} submissions={submissions} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error loading reseller profile:', error);
    throw error;
  }
} 