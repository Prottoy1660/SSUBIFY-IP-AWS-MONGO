'use server';

import { signIn } from 'next-auth/react';
import { getDeviceInfo } from '@/lib/utils';
import { trackLogin } from '@/lib/data-service';
import { getCurrentUser } from '@/lib/auth';

export async function login(
  email: string,
  password: string,
  userAgent: string,
  ipAddress: string
) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // Track failed login
      await trackLogin(
        email,
        'reseller', // Default to reseller, will be updated if admin
        ipAddress,
        userAgent,
        getDeviceInfo(userAgent),
        undefined,
        'failed',
        result.error
      );
      return { error: result.error };
    }

    // Get user role from the session
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Failed to get user information' };
    }

    // Track successful login
    await trackLogin(
      user.id,
      user.role,
      ipAddress,
      userAgent,
      getDeviceInfo(userAgent)
    );

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred' };
  }
} 