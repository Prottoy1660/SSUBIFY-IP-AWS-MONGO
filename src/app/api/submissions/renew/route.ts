import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateSubmissionStatus } from '@/lib/data-service';
import { addMonths } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'reseller') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { submissionId } = await request.json();
    if (!submissionId) {
      return new NextResponse('Submission ID is required', { status: 400 });
    }

    const updatedSubmission = await updateSubmissionStatus(submissionId, 'Successful');
    if (!updatedSubmission) {
      return new NextResponse('Failed to renew package', { status: 500 });
    }

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error in renew submission:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 