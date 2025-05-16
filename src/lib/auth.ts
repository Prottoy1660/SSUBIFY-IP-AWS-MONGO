'use server';
import { cookies } from 'next/headers';
import type { User } from '@/types';
import { getUsersCollection, mapMongoDocument } from './mongodb';
import { AUTH_COOKIE_NAME } from './constants';
import { seedInitialData } from './db-seed'; // To ensure admin/initial users exist
import { trackLogin } from './data-service';
import { getDeviceInfo } from './utils';
import { formatISO } from 'date-fns';

export async function login(
  identifier: string, 
  password?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<User | null> {
  await seedInitialData(); // Ensure initial users are in DB
  const usersCollection = await getUsersCollection();

  // Try to find user by email or phone
  const userDoc = await usersCollection.findOne({
    $or: [
      { email: identifier },
      { phone: identifier }
    ]
  });

  // Prevent banned users from logging in
  if (userDoc && userDoc.banned) {
    return null;
  }

  // Check the real password (plain text for demo)
  if (userDoc && userDoc.password === password) {
    const user = mapMongoDocument<User>(userDoc);
    const cookieStore = cookies();
    // @ts-expect-error: cookies() returns a mutable object in server actions
    cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Track successful login
    if (userAgent && ipAddress) {
      await trackLogin(
        user.id,
        user.role,
        ipAddress,
        userAgent,
        getDeviceInfo(userAgent),
        undefined,
        'success'
      );
    }

    return user;
  }

  // Track failed login attempt
  if (userAgent && ipAddress) {
    await trackLogin(
      identifier,
      'reseller', // Default to reseller for failed attempts
      ipAddress,
      userAgent,
      getDeviceInfo(userAgent),
      undefined,
      'failed',
      'Invalid credentials'
    );
  }

  return null;
}

export async function register(email: string, phone: string, name: string, password?: string): Promise<User | null> {
  await seedInitialData(); // Ensure DB connection is warm and for consistency
  const usersCollection = await getUsersCollection();

  // Check if user already exists
  const existingUser = await usersCollection.findOne({
    $or: [
      { email },
      { phone }
    ]
  });

  if (existingUser) {
    return null;
  }

  const now = formatISO(new Date());
  
  // Create new user with proper name handling
  const newUserDefinition: Omit<User, '_id'> & { password: string } = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email,
    phone,
    name: name.trim(), // Ensure name is properly trimmed
    role: 'reseller', // Default role for registration
    password: password || '', // TODO: Add proper password hashing in production
    createdAt: now,
    updatedAt: now
  };
  
  const result = await usersCollection.insertOne(newUserDefinition as any);
  const insertedUserDoc = await usersCollection.findOne({ _id: result.insertedId });

  if (!insertedUserDoc) {
    throw new Error("Failed to retrieve user after registration.");
  }

  // Remove password from the returned user object
  const { password: _, ...userWithoutPassword } = insertedUserDoc;
  const newUser = mapMongoDocument<User>(userWithoutPassword);

  const cookieStore = cookies();
  // @ts-expect-error: cookies() returns a mutable object in server actions
  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(newUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return newUser;
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  // @ts-expect-error: cookies() returns a mutable object in server actions
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (userCookie?.value) {
    try {
      // Potentially re-validate user against DB here if needed for session validity
      return JSON.parse(userCookie.value) as User;
    } catch (error) {
      console.error('Failed to parse user cookie:', error);
      return null;
    }
  }
  return null;
}
