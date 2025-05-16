import type { ObjectId } from 'mongodb';

export type UserRole = "admin" | "reseller";

export interface User {
  _id?: ObjectId; // MongoDB internal ID
  id: string;
  email: string;
  phone: string;
  name?: string;
  image?: string; // Optional profile image URL
  role: UserRole;
  password?: string;
  banned?: boolean;
  createdAt: string;
  updatedAt: string;
  paymentRequests?: PaymentRequest[];
}

export type SubmissionStatus = "Pending" | "Successful" | "Canceled";

export interface Plan {
  _id?: ObjectId; // MongoDB internal ID
  id: string;
  name: string;
  durationMonths: number; 
}

export interface Submission {
  _id?: ObjectId; // MongoDB internal ID
  id: string;
  customerEmail: string;
  requestedPlanId: string;
  durationMonths: number; 
  notes?: string;
  profileName?: string; 
  status: SubmissionStatus;
  resellerId: string;
  resellerName: string; 
  requestDate: string; 
  startDate?: string; 
  endDate?: string; 
  renewalLikelihood?: number; 
  renewalReason?: string;
  createdAt: string; 
  updatedAt: string; 
}

export type PaymentMethod = 'Bkash' | 'Nagad' | 'Rocket';

export type PaymentStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PaymentRequest {
  id: string;
  resellerId: string;
  amount: number;
  currency: 'BDT';
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  requestDate: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInfo {
  id: string;
  userId: string;
  userRole: 'admin' | 'reseller';
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: string;
    deviceType: string;
    screenResolution?: string;
    timezone: string;
    language: string;
  };
  location?: {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  timestamp: string;
  status: 'success' | 'failed';
  failureReason?: string;
}
