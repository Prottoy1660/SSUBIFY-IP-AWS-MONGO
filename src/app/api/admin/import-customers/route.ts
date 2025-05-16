import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { getCurrentUser } from '@/lib/auth';
import { addSubmission } from '@/lib/data-service';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const csvFile = formData.get('csvFile') as File;
    const requestedPlanId = formData.get('requestedPlanId') as string;
    const durationMonths = parseInt(formData.get('durationMonths') as string);
    const subscriptionStartDate = formData.get('subscriptionStartDate') as string;

    if (!csvFile || !requestedPlanId || !durationMonths || !subscriptionStartDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const csvText = await csvFile.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const importedCustomers = [];
    const errors = [];

    // Calculate the end date based on the subscription start date
    const startDate = new Date(subscriptionStartDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    for (const record of records) {
      try {
        if (!record.email) {
          errors.push(`Missing email for record: ${JSON.stringify(record)}`);
          continue;
        }

        const submissionData = {
          customerEmail: record.email,
          requestedPlanId,
          durationMonths,
          status: 'Successful',
          requestDate: subscriptionStartDate, // When the subscription was actually given
          startDate: subscriptionStartDate,   // When the subscription was actually given
          endDate: endDate.toISOString(),     // Calculated from the actual start date
          resellerId: currentUser.id,
          resellerName: currentUser.name || currentUser.email,
        };

        const submission = await addSubmission(submissionData);
        if (submission) {
          importedCustomers.push(submission);
        }
      } catch (error) {
        errors.push(`Failed to import customer ${record.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Revalidate both admin and reseller dashboards
    revalidatePath('/admin/dashboard');
    revalidatePath('/reseller/dashboard');

    return NextResponse.json({
      importedCount: importedCustomers.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing customers:', error);
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 }
    );
  }
} 