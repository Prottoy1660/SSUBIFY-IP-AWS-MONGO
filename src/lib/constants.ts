import type { Plan, User } from '@/types';
import { formatISO } from 'date-fns';

const now = formatISO(new Date());

export const INITIAL_MOCK_USERS: User[] = [
  { 
    id: 'admin-001', 
    email: 'admin@example.com', 
    name: 'Admin User', 
    role: 'admin',
    phone: '01700000000',
    createdAt: now,
    updatedAt: now
  },
  { 
    id: 'reseller-001', 
    email: 'reseller@example.com', 
    name: 'Reseller One', 
    role: 'reseller',
    phone: '01700000001',
    createdAt: now,
    updatedAt: now
  },
  { 
    id: 'reseller-002', 
    email: 'reseller2@example.com', 
    name: 'Reseller Two', 
    role: 'reseller',
    phone: '01700000002',
    createdAt: now,
    updatedAt: now
  },
];

export const INITIAL_MOCK_PLANS: Plan[] = [
  { id: 'plan-basic', name: 'Adobe Basic Cloud', durationMonths: 12 },
  { id: 'plan-standard', name: 'Adobe Standard Suite', durationMonths: 12 },
  { id: 'plan-premium', name: 'Adobe Premium All Apps', durationMonths: 24 },
  { id: 'plan-enterprise', name: 'Adobe Enterprise Pack', durationMonths: 36 },
];

// Non-data constants
export const AUTH_COOKIE_NAME = 'subtrack-lite-auth';
export const APP_NAME = "Subify";
export const LOGIN_PATH = "/auth/login";
export const REGISTER_PATH = "/auth/register";
export const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
export const RESELLER_DASHBOARD_PATH = "/reseller/dashboard";
export const RESELLER_SUBMIT_PATH = "/reseller/submit";
