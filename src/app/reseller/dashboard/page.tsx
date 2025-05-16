import { ResellerDashboardWrapper } from '@/components/reseller/dashboard-wrapper';
import { fetchSubmissionsForReseller } from '@/app/actions';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'; 
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dashboard | Subify Reseller',
  description: 'View your customer email submissions and their statuses.',
};

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-10 w-1/3" />
      <div className="flex space-x-2 border-b pb-2 mb-4 md:max-w-md">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-20 rounded-full" /> 
        </div>
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default async function ResellerDashboardPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <React.Suspense fallback={<DashboardLoadingSkeleton />}>
        <SubmissionsList />
      </React.Suspense>
    </div>
  );
}

async function SubmissionsList() {
  const submissions = await fetchSubmissionsForReseller();
  return <ResellerDashboardWrapper submissions={submissions} />;
}
