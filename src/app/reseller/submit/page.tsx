
import { SubmissionForm } from '@/components/reseller/submission-form';
import { getPlans } from '@/app/actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Submission | Subify',
  description: 'Submit a new customer subscription request.',
};

export default async function SubmitPage() {
  const plans = await getPlans();

  return (
    <div className="container mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SubmissionForm plans={plans} />
    </div>
  );
}
