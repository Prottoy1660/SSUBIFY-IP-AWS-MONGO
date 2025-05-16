'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { login as authLogin, register as authRegister, logout as authLogout, getCurrentUser } from '@/lib/auth';
import { 
  addSubmission as dbAddSubmission, 
  updateSubmissionStatus as dbUpdateSubmissionStatus, 
  getAllSubmissions as dbGetAllSubmissions, 
  getSubmissionsByResellerId as dbGetSubmissionsByResellerId,
  updateSubmissionProfileName as dbUpdateSubmissionProfileName,
  getPlansFromDb, // Updated
  getResellersFromDb // Updated
} from '@/lib/data-service';
import type { Submission, SubmissionStatus, User, Plan } from '@/types';
import { predictRenewalLikelihood } from '@/ai/flows/renewal-likelihood-prediction';
import { ADMIN_DASHBOARD_PATH, LOGIN_PATH, RESELLER_DASHBOARD_PATH } from '@/lib/constants';
import { revalidatePath } from 'next/cache';

// Schemas for validation
const LoginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or phone is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const RegisterSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const NewSubmissionSchema = z.object({
  customerEmail: z.string().email({ message: 'Invalid customer email.' }),
  requestedPlanId: z.string().min(1, { message: 'Plan is required.' }),
  durationMonths: z.coerce.number().int().min(1, { message: 'Duration must be at least 1 month.' }),
  notes: z.string().optional(),
});

const UpdateProfileNameSchema = z.object({
  submissionId: z.string().min(1, { message: 'Submission ID is required.'}),
  profileName: z.string().max(100, { message: 'Profile name cannot exceed 100 characters.'}).optional(),
});


export async function handleLogin(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }

  const { identifier, password } = validatedFields.data;
  const userAgent = formData.get('userAgent') as string;
  const ipAddress = formData.get('ipAddress') as string;

  const user = await authLogin(identifier, password, userAgent, ipAddress);

  if (!user) {
    return { message: 'Invalid credentials.' };
  }

  if (user.role === 'admin') {
    redirect(ADMIN_DASHBOARD_PATH);
  } else if (user.role === 'reseller') {
    redirect(RESELLER_DASHBOARD_PATH);
  }
  return { message: 'Login successful' }; 
}


export async function handleRegister(prevState: any, formData: FormData) {
  const validatedFields = RegisterSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }

  const { email, phone, name, password } = validatedFields.data;
  const user = await authRegister(email, phone, name, password);

  if (!user) {
    return { message: 'Registration failed. Email or phone might be taken.' };
  }
  redirect(RESELLER_DASHBOARD_PATH);
  return { message: 'Registration successful' }; 
}

export async function handleLogout() {
  await authLogout();
  redirect(LOGIN_PATH);
}

export async function submitNewCustomer(prevState: any, formData: FormData): Promise<{ message: string, errors?: any, submission?: Submission }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return {
      message: 'Unauthorized',
      errors: { general: ['You must be an admin to add customers.'] }
    };
  }

  const customerEmail = formData.get('customerEmail') as string;
  const requestedPlanId = formData.get('requestedPlanId') as string;
  const durationMonths = parseInt(formData.get('durationMonths') as string);
  const subscriptionStartDate = formData.get('subscriptionStartDate') as string;
  const notes = formData.get('notes') as string;

  if (!requestedPlanId || !durationMonths || !subscriptionStartDate) {
    return {
      message: 'Missing required fields',
      errors: { general: ['Please fill in all required fields.'] }
    };
  }

  // If using CSV import, customerEmail is not required
  if (!customerEmail && !formData.get('csvFile')) {
    return {
      message: 'Missing customer email',
      errors: { general: ['Please provide a customer email or use CSV import.'] }
    };
  }

  // Calculate the end date based on the subscription start date
  const startDate = new Date(subscriptionStartDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const submissionData = {
    customerEmail,
    requestedPlanId,
    durationMonths,
    status: 'Successful',
    requestDate: subscriptionStartDate, // When the subscription was actually given
    startDate: subscriptionStartDate,   // When the subscription was actually given
    endDate: endDate.toISOString(),     // Calculated from the actual start date
    resellerId: currentUser.id,
    resellerName: currentUser.name || currentUser.email,
    notes,
  };

  try {
    const newSubmission = await dbAddSubmission(submissionData);
    if (!newSubmission) {
      throw new Error('Failed to create submission');
    }
    
    // Revalidate both admin and reseller dashboards
    revalidatePath('/admin/dashboard');
    revalidatePath('/reseller/dashboard');
    
    return { 
      message: 'Customer added successfully!', 
      submission: newSubmission 
    };
  } catch (error) {
    console.error("Error in submitNewCustomer action:", error);
    return { 
      message: `Failed to add customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: { general: ['Failed to add customer. Please try again.'] }
    };
  }
}

export async function updateSubmission(submissionId: string, status: SubmissionStatus): Promise<{ message: string, submission?: Submission }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return { message: 'Unauthorized.' };
  }

  try {
    const updatedSubmission = await dbUpdateSubmissionStatus(submissionId, status);
    if (!updatedSubmission) {
      return { message: 'Submission not found or update failed.' };
    }
    revalidatePath(ADMIN_DASHBOARD_PATH);
    revalidatePath(RESELLER_DASHBOARD_PATH); 
    return { message: `Submission status updated to ${status}.`, submission: updatedSubmission };
  } catch (error) {
    console.error("Error in updateSubmission action:", error);
    return { message: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function updateSubmissionProfileName(prevState: any, formData: FormData): Promise<{ message: string, errors?: any, submission?: Submission }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    return { message: 'Unauthorized.' };
  }

  const validatedFields = UpdateProfileNameSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields.',
    };
  }
  
  const { submissionId, profileName } = validatedFields.data;

  try {
    const updatedSubmission = await dbUpdateSubmissionProfileName(submissionId, profileName);
    if (!updatedSubmission) {
      return { message: 'Submission not found or profile name update failed.' };
    }
    revalidatePath(ADMIN_DASHBOARD_PATH);
    revalidatePath(RESELLER_DASHBOARD_PATH);
    return { message: 'Profile name updated successfully.', submission: updatedSubmission };
  } catch (error) {
    console.error("Error in updateSubmissionProfileName action:", error);
    throw error;
  }
}


export async function fetchAllSubmissionsForAdmin(): Promise<Submission[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        console.warn("Unauthorized attempt to fetch admin submissions");
        return [];
    }
    return dbGetAllSubmissions();
}

export async function fetchSubmissionsForReseller(): Promise<Submission[]> {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'reseller') {
        console.warn("Unauthorized attempt to fetch reseller submissions or no user found");
        return [];
    }
    return dbGetSubmissionsByResellerId(currentUser.id);
}

export async function getPlans(): Promise<Plan[]> {
  return await getPlansFromDb(); // Use DB version
}

export async function getResellers(): Promise<User[]> {
  return await getResellersFromDb(); // Use DB version
}
