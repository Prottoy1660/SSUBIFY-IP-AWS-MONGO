import { sql } from 'drizzle-orm';
import { 
  text, 
  timestamp, 
  pgTable, 
  serial, 
  integer, 
  decimal, 
  boolean,
  json
} from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  customerEmail: text('customer_email').notNull(),
  requestedPlanId: text('requested_plan_id').notNull(),
  durationMonths: integer('duration_months').notNull(),
  requestDate: timestamp('request_date').notNull().defaultNow(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  status: text('status').notNull().default('Pending'),
  notes: text('notes'),
  profileName: text('profile_name'),
  resellerId: text('reseller_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  items: text('items').notNull(), // JSON string of items
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp('due_date').notNull(),
  notes: text('notes'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  gracePeriod: integer('grace_period').notNull().default(0),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  date: timestamp('date').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}); 