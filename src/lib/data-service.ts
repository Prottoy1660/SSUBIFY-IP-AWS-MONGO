'use server';
import type { Submission, SubmissionStatus, Plan, User, PaymentRequest, PaymentMethod, PaymentStatus, LoginInfo } from '@/types';
import { getSubmissionsCollection, getUsersCollection, getPlansCollection, mapMongoDocument, mapMongoDocuments } from './mongodb';
import { formatISO } from 'date-fns';
import { ObjectId } from 'mongodb';
import { seedInitialData } from './db-seed'; // To handle initial plans/users
import { addDays } from 'date-fns';
import { getMongoClient } from './mongodb';
import { addMonths, parseISO } from 'date-fns';
import { db } from '@/lib/db';
import { submissions, transactions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllSubmissions(): Promise<Submission[]> {
  const submissionsCollection = await getSubmissionsCollection();
  // Ensure submissions always exist from DB.
  const submissions = await submissionsCollection.find().sort({ createdAt: -1 }).toArray();
  return mapMongoDocuments<Submission>(submissions);
}

export async function getSubmissionsByResellerId(resellerId: string): Promise<Submission[]> {
  const submissionsCollection = await getSubmissionsCollection();
  const submissions = await submissionsCollection.find({ resellerId }).sort({ createdAt: -1 }).toArray();
  return mapMongoDocuments<Submission>(submissions);
}

export async function getSubmissionById(id: string): Promise<Submission | undefined> {
  const submissionsCollection = await getSubmissionsCollection();
  // MongoDB uses ObjectId for _id, but we are querying by our string 'id' field
  const submission = await submissionsCollection.findOne({ id });
  return submission ? mapMongoDocument<Submission>(submission) : undefined;
}

export async function addSubmission(
  data: Omit<Submission, 'id' | 'requestDate' | 'createdAt' | 'updatedAt' | 'status' | 'startDate' | 'endDate' | 'profileName'> & Partial<Pick<Submission, 'renewalLikelihood' | 'renewalReason' | 'startDate' | 'endDate'>>
): Promise<Submission> {
  const submissionsCollection = await getSubmissionsCollection();
  const now = formatISO(new Date());

  // If startDate is provided, use it to calculate endDate
  let startDate = data.startDate;
  let endDate = data.endDate;
  
  if (startDate && !endDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + (data.durationMonths || 1));
    endDate = formatISO(end);
  }

  const newSubmissionData: Omit<Submission, '_id'> = { // Use Omit with internal _id
    ...data,
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    status: 'Successful', // Automatically set as Successful for admin-added submissions
    requestDate: now,
    profileName: undefined,
    startDate: startDate,
    endDate: endDate,
    createdAt: now,
    updatedAt: now,
  };

  const result = await submissionsCollection.insertOne(newSubmissionData as any); // Cast to any to bypass _id issue for insert
  
  // Fetch the inserted document to return it with MongoDB's _id mapped to id string
  const insertedDoc = await submissionsCollection.findOne({ _id: result.insertedId });
  if (!insertedDoc) {
    throw new Error('Failed to retrieve submission after insert.');
  }
  return mapMongoDocument<Submission>(insertedDoc);
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  durationMonths?: number
): Promise<Submission | null> {
  try {
    const submissionsCollection = await getSubmissionsCollection();
    
    // Try to find by custom id first, then by _id if id looks like an ObjectId
    let submissionToUpdate = await submissionsCollection.findOne({ id: submissionId });
    if (!submissionToUpdate && ObjectId.isValid(submissionId)) {
      submissionToUpdate = await submissionsCollection.findOne({ _id: new ObjectId(submissionId) });
    }

    if (!submissionToUpdate) {
      throw new Error('Submission not found');
    }

    // For renewals, start from the current date
    let startDate = submissionToUpdate.startDate;
    let endDate = submissionToUpdate.endDate;

    if (status === 'Successful') {
      if (durationMonths) {
        // For both renewals and new approvals, use the current date as start date
        const now = new Date();
        startDate = formatISO(now);
        endDate = formatISO(addMonths(now, durationMonths));
      }
    }

    // Use the correct filter for update
    const filter = submissionToUpdate.id ? { id: submissionToUpdate.id } : { _id: submissionToUpdate._id };

    const updateData = {
      status,
      startDate,
      endDate,
      updatedAt: formatISO(new Date())
    };

    const result = await submissionsCollection.findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result ? mapMongoDocument<Submission>(result) : null;
  } catch (error) {
    console.error('Error updating submission status:', error);
    return null;
  }
}

export async function updateSubmissionProfileName(id: string, profileName?: string): Promise<Submission | null> {
  const submissionsCollection = await getSubmissionsCollection();
  const now = formatISO(new Date());

  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let submissionToUpdate = await submissionsCollection.findOne({ id });
  if (!submissionToUpdate && ObjectId.isValid(id)) {
    submissionToUpdate = await submissionsCollection.findOne({ _id: new ObjectId(id) });
  }
  if (!submissionToUpdate) {
    console.error(`Submission with ID ${id} not found for profile name update.`);
    return null;
  }

  // Use the correct filter for update
  const filter = submissionToUpdate.id ? { id: submissionToUpdate.id } : { _id: submissionToUpdate._id };

  const result = await submissionsCollection.findOneAndUpdate(
    filter,
    { $set: { profileName: profileName && profileName.trim() !== "" ? profileName.trim() : undefined, updatedAt: now } },
    { returnDocument: 'after' }
  );
  if (!result) {
    console.error(`Failed to update profile name for submission with ID ${id}.`);
  }
  return result ? mapMongoDocument<Submission>(result) : null;
}

// Functions to get plans and resellers from DB
export async function getPlansFromDb(): Promise<Plan[]> {
  await seedInitialData(); // Ensure data is seeded
  const plansCollection = await getPlansCollection();
  const plans = await plansCollection.find().toArray();
  return mapMongoDocuments<Plan>(plans);
}

export async function getResellersFromDb(): Promise<User[]> {
  await seedInitialData(); // Ensure data is seeded
  const usersCollection = await getUsersCollection();
  const resellers = await usersCollection.find({ role: 'reseller' }).toArray();
  return mapMongoDocuments<User>(resellers);
}

export async function getResellerById(id: string): Promise<User | null> {
  const usersCollection = await getUsersCollection();
  
  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let userDoc = await usersCollection.findOne({ id });
  if (!userDoc && ObjectId.isValid(id)) {
    userDoc = await usersCollection.findOne({ _id: new ObjectId(id) });
  }
  
  if (!userDoc) {
    return null;
  }

  // Remove sensitive information
  const { password, ...userWithoutPassword } = userDoc;
  return mapMongoDocument<User>(userWithoutPassword);
}

export async function banReseller(id: string, banned: boolean): Promise<User | null> {
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());

  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let userToUpdate = await usersCollection.findOne({ id });
  if (!userToUpdate && ObjectId.isValid(id)) {
    userToUpdate = await usersCollection.findOne({ _id: new ObjectId(id) });
  }
  if (!userToUpdate) {
    console.error(`Reseller with ID ${id} not found.`);
    return null;
  }

  // Use the correct filter for update
  const filter = userToUpdate.id ? { id: userToUpdate.id } : { _id: userToUpdate._id };

  const result = await usersCollection.findOneAndUpdate(
    filter,
    { $set: { banned, updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (!result) {
    return null;
  }

  // Remove sensitive information
  const { password, ...userWithoutPassword } = result;
  return mapMongoDocument<User>(userWithoutPassword);
}

export async function resetResellerPassword(id: string, newPassword: string): Promise<User | null> {
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());

  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let userToUpdate = await usersCollection.findOne({ id });
  if (!userToUpdate && ObjectId.isValid(id)) {
    userToUpdate = await usersCollection.findOne({ _id: new ObjectId(id) });
  }
  if (!userToUpdate) {
    console.error(`Reseller with ID ${id} not found.`);
    return null;
  }

  // Use the correct filter for update
  const filter = userToUpdate.id ? { id: userToUpdate.id } : { _id: userToUpdate._id };

  // TODO: In production, hash the password before storing
  const result = await usersCollection.findOneAndUpdate(
    filter,
    { $set: { password: newPassword, updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (!result) {
    return null;
  }

  // Remove sensitive information
  const { password, ...userWithoutPassword } = result;
  return mapMongoDocument<User>(userWithoutPassword);
}

export async function deleteReseller(id: string): Promise<boolean> {
  const usersCollection = await getUsersCollection();
  const submissionsCollection = await getSubmissionsCollection();

  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let userToDelete = await usersCollection.findOne({ id });
  if (!userToDelete && ObjectId.isValid(id)) {
    userToDelete = await usersCollection.findOne({ _id: new ObjectId(id) });
  }
  if (!userToDelete) {
    console.error(`Reseller with ID ${id} not found.`);
    return false;
  }

  // Use the correct filter for delete
  const filter = userToDelete.id ? { id: userToDelete.id } : { _id: userToDelete._id };

  // Delete all submissions associated with the reseller
  await submissionsCollection.deleteMany({ resellerId: userToDelete.id });

  // Delete the reseller account
  const result = await usersCollection.deleteOne(filter);
  return result.deletedCount > 0;
}

export async function updateResellerInfo(
  id: string,
  updates: { name?: string; email?: string; phone?: string }
): Promise<User | null> {
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());

  // Try to find by custom id first, then by _id if id looks like an ObjectId
  let userToUpdate = await usersCollection.findOne({ id });
  if (!userToUpdate && ObjectId.isValid(id)) {
    userToUpdate = await usersCollection.findOne({ _id: new ObjectId(id) });
  }
  if (!userToUpdate) {
    console.error(`Reseller with ID ${id} not found.`);
    return null;
  }

  // Use the correct filter for update
  const filter = userToUpdate.id ? { id: userToUpdate.id } : { _id: userToUpdate._id };

  const result = await usersCollection.findOneAndUpdate(
    filter,
    { $set: { ...updates, updatedAt: now } },
    { returnDocument: 'after' }
  );

  if (!result) {
    return null;
  }

  // Remove sensitive information
  const { password, ...userWithoutPassword } = result;
  return mapMongoDocument<User>(userWithoutPassword);
}

export async function createPaymentRequest(resellerId: string, amount: number): Promise<PaymentRequest | null> {
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());

  try {
    console.log('Starting payment request creation for reseller:', resellerId);
    
    // First, check if the reseller exists
    const reseller = await usersCollection.findOne({ id: resellerId });
    console.log('Reseller lookup result:', reseller ? 'Found' : 'Not found');
    
    if (!reseller) {
      console.error(`Reseller with ID ${resellerId} not found.`);
      return null;
    }

    const paymentRequest: Omit<PaymentRequest, '_id'> = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      resellerId,
      amount,
      currency: 'BDT',
      status: 'Pending',
      requestDate: now,
      createdAt: now,
      updatedAt: now,
    };

    console.log('Created payment request object:', paymentRequest);

    // First ensure the paymentRequests array exists
    await usersCollection.updateOne(
      { id: resellerId, paymentRequests: { $exists: false } },
      { $set: { paymentRequests: [] } }
    );

    // Then add the new payment request
    const result = await usersCollection.findOneAndUpdate(
      { id: resellerId },
      { $push: { paymentRequests: paymentRequest } },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.error('Failed to create payment request - no result returned from update');
      return null;
    }

    // Find the newly created request in the updated document
    const createdRequest = result.paymentRequests?.find(
      (req: PaymentRequest) => req.id === paymentRequest.id
    );

    if (!createdRequest) {
      console.error('Failed to find created payment request in updated document');
      console.log('Available payment requests:', result.paymentRequests);
      return null;
    }

    console.log('Successfully created payment request:', createdRequest);
    return createdRequest;
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw error;
  }
}

export async function getPaymentRequestsByResellerId(resellerId: string): Promise<PaymentRequest[]> {
  const usersCollection = await getUsersCollection();
  
  try {
    console.log('Fetching payment requests for reseller:', resellerId);
    
    // Try to find by custom id first, then by _id if id looks like an ObjectId
    let reseller = await usersCollection.findOne({ id: resellerId });
    if (!reseller && ObjectId.isValid(resellerId)) {
      reseller = await usersCollection.findOne({ _id: new ObjectId(resellerId) });
    }
    
    if (!reseller) {
      console.error(`Reseller with ID ${resellerId} not found when fetching payment requests`);
      return [];
    }

    if (!reseller.paymentRequests) {
      console.log(`No payment requests found for reseller ${resellerId}`);
      return [];
    }

    // Sort payment requests by request date, newest first
    const sortedRequests = [...reseller.paymentRequests].sort((a: PaymentRequest, b: PaymentRequest) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );

    console.log(`Found ${sortedRequests.length} payment requests for reseller ${resellerId}`);
    return sortedRequests;
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    return [];
  }
}

export async function updatePaymentRequest(
  resellerId: string,
  paymentRequestId: string,
  updates: {
    status: PaymentStatus;
    paymentMethod?: PaymentMethod;
    transactionId?: string;
  }
): Promise<PaymentRequest | null> {
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());

  const updateData: any = {
    'paymentRequests.$[elem].status': updates.status,
    'paymentRequests.$[elem].updatedAt': now,
  };

  if (updates.paymentMethod) {
    updateData['paymentRequests.$[elem].paymentMethod'] = updates.paymentMethod;
  }
  if (updates.transactionId) {
    updateData['paymentRequests.$[elem].transactionId'] = updates.transactionId;
  }
  if (updates.status === 'Approved') {
    updateData['paymentRequests.$[elem].paymentDate'] = now;
  }

  const result = await usersCollection.findOneAndUpdate(
    { id: resellerId },
    { $set: updateData },
    {
      arrayFilters: [{ 'elem.id': paymentRequestId }],
      returnDocument: 'after',
    }
  );

  if (!result) {
    return null;
  }

  const updatedRequest = result.paymentRequests?.find(
    (req: PaymentRequest) => req.id === paymentRequestId
  );

  return updatedRequest || null;
}

export async function createSuccessfulSubmission(
  resellerId: string,
  customerEmail: string,
  durationMonths: number = 1,
  requestedPlanId: string = 'basic'
): Promise<Submission | null> {
  const submissionsCollection = await getSubmissionsCollection();
  const usersCollection = await getUsersCollection();
  const now = formatISO(new Date());
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + durationMonths);

  // Get the reseller's name
  const reseller = await usersCollection.findOne({ id: resellerId });
  if (!reseller || !reseller.name) {
    console.error('Reseller not found or has no name');
    return null;
  }

  const newSubmission: Omit<Submission, '_id'> = {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    resellerId,
    resellerName: reseller.name,
    customerEmail,
    status: 'Successful',
    requestDate: now,
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
    durationMonths,
    requestedPlanId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await submissionsCollection.insertOne(newSubmission as any);
    if (!result.insertedId) {
      console.error('Failed to insert new submission');
      return null;
    }

    const insertedDoc = await submissionsCollection.findOne({ _id: result.insertedId });
    return insertedDoc ? mapMongoDocument<Submission>(insertedDoc) : null;
  } catch (error) {
    console.error('Error creating successful submission:', error);
    return null;
  }
}

export async function getExpiringSubmissions(): Promise<Submission[]> {
  const submissionsCollection = await getSubmissionsCollection();
  const now = new Date();
  const oneWeekFromNow = addDays(now, 7);

  try {
    // Find submissions that are expired or will expire within the next week
    const expiringSubmissions = await submissionsCollection.find({
      status: 'Successful',
      endDate: {
        $lte: formatISO(oneWeekFromNow)
      }
    }).toArray();

    return mapMongoDocuments<Submission>(expiringSubmissions);
  } catch (error) {
    console.error('Error fetching expiring submissions:', error);
    return [];
  }
}

export async function markNotificationAsRead(submissionId: string): Promise<boolean> {
  const submissionsCollection = await getSubmissionsCollection();
  const now = formatISO(new Date());

  try {
    const result = await submissionsCollection.updateOne(
      { id: submissionId },
      { $set: { notificationRead: true, updatedAt: now } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

async function getLoginInfoCollection() {
  const client = await getMongoClient();
  return client.db().collection('loginInfo');
}

export async function trackLogin(
  userId: string,
  userRole: 'admin' | 'reseller',
  ipAddress: string,
  userAgent: string,
  deviceInfo: LoginInfo['deviceInfo'],
  location?: LoginInfo['location'],
  status: 'success' | 'failed' = 'success',
  failureReason?: string
): Promise<LoginInfo | null> {
  const loginInfoCollection = await getLoginInfoCollection();
  const now = formatISO(new Date());

  const loginInfo: Omit<LoginInfo, '_id'> = {
    id: `login-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userRole,
    ipAddress,
    userAgent,
    deviceInfo,
    location,
    timestamp: now,
    status,
    failureReason,
  };

  try {
    const result = await loginInfoCollection.insertOne(loginInfo as any);
    if (!result.insertedId) {
      console.error('Failed to insert login info');
      return null;
    }

    const insertedDoc = await loginInfoCollection.findOne({ _id: result.insertedId });
    return insertedDoc ? mapMongoDocument<LoginInfo>(insertedDoc) : null;
  } catch (error) {
    console.error('Error tracking login:', error);
    return null;
  }
}

export async function getLoginHistory(userId: string): Promise<LoginInfo[]> {
  const loginInfoCollection = await getLoginInfoCollection();
  
  try {
    const loginHistory = await loginInfoCollection
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();
    
    return mapMongoDocuments<LoginInfo>(loginHistory);
  } catch (error) {
    console.error('Error fetching login history:', error);
    return [];
  }
}

export async function getAllLoginHistory(): Promise<LoginInfo[]> {
  const loginInfoCollection = await getLoginInfoCollection();
  
  try {
    const loginHistory = await loginInfoCollection
      .find()
      .sort({ timestamp: -1 })
      .toArray();
    
    return mapMongoDocuments<LoginInfo>(loginHistory);
  } catch (error) {
    console.error('Error fetching all login history:', error);
    return [];
  }
}

export async function deleteUserAccount(id: string): Promise<boolean> {
  const submissionsCollection = await getSubmissionsCollection();
  const usersCollection = await getUsersCollection();

  try {
    console.log('Starting deleteUserAccount for ID:', id);
    
    // First find the submission to get the customer email and reseller ID
    const submission = await submissionsCollection.findOne({ _id: new ObjectId(id) });
    if (!submission) {
      console.error(`Submission with ID ${id} not found.`);
      return false;
    }
    console.log('Found submission:', { 
      id: submission._id, 
      customerEmail: submission.customerEmail,
      resellerId: submission.resellerId 
    });

    // Delete all submissions associated with this customer email
    const submissionsResult = await submissionsCollection.deleteMany({ 
      customerEmail: submission.customerEmail 
    });
    console.log(`Deleted ${submissionsResult.deletedCount} submissions for customer ${submission.customerEmail}`);

    // Try to find the user by email first
    const user = await usersCollection.findOne({ email: submission.customerEmail });
    if (user) {
      console.log('Found user account to delete:', { email: user.email, id: user.id });
      // Delete the user account
      const userResult = await usersCollection.deleteOne({ email: submission.customerEmail });
      if (!userResult.deletedCount) {
        console.error(`Failed to delete user account for ${submission.customerEmail}`);
        return false;
      }
      console.log(`Deleted user account for ${submission.customerEmail}`);
    } else {
      console.log(`No user account found for ${submission.customerEmail}`);
    }

    // If this was a reseller's submission, also delete the reseller's account
    if (submission.resellerId) {
      const resellerResult = await usersCollection.deleteOne({ id: submission.resellerId });
      if (resellerResult.deletedCount) {
        console.log(`Deleted reseller account with ID ${submission.resellerId}`);
      } else {
        console.log(`No reseller account found with ID ${submission.resellerId}`);
      }
    }

    console.log('Successfully completed deleteUserAccount operation');
    return true;
  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export async function createTransaction(transaction: {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  description: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  referenceId?: string;
  notes?: string;
}): Promise<void> {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const transactionsCollection = db.collection('transactions');
    
    await transactionsCollection.insertOne({
      ...transaction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export async function getTransactions(): Promise<Array<{
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  description: string;
  type: 'income' | 'expense';
  status: 'pending' | 'completed' | 'failed';
  referenceId?: string;
  notes?: string;
  category: string;
}>> {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const transactionsCollection = db.collection('transactions');
    
    const transactions = await transactionsCollection
      .find()
      .sort({ date: -1 })
      .toArray();
    
    return transactions.map(tx => ({
      id: tx._id.toString(),
      date: tx.date,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      description: tx.description,
      type: tx.type as 'income' | 'expense',
      status: tx.status as 'pending' | 'completed' | 'failed',
      referenceId: tx.referenceId || undefined,
      notes: tx.notes || undefined,
      category: tx.category || 'other',
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const transactionsCollection = db.collection('transactions');
    
    await transactionsCollection.deleteOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

export async function getApprovedCustomerEmails(): Promise<Array<{ email: string; name?: string; plan: string; startDate: string; endDate: string }>> {
  const submissionsCollection = await getSubmissionsCollection();
  
  try {
    const approvedSubmissions = await submissionsCollection
      .find({ status: 'Successful' })
      .sort({ createdAt: -1 })
      .toArray();
    
    return approvedSubmissions.map(submission => ({
      email: submission.customerEmail,
      name: submission.profileName || undefined,
      plan: submission.requestedPlanId,
      startDate: submission.startDate || formatISO(new Date()),
      endDate: submission.endDate || formatISO(new Date())
    }));
  } catch (error) {
    console.error('Error fetching approved customer emails:', error);
    throw error;
  }
}
