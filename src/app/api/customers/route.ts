import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, invoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address } = body;

    // Create customer
    const [customer] = await db
      .insert(customers)
      .values({
        name,
        email,
        phone,
        address,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create initial invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        customerId: customer.id,
        items: JSON.stringify([{ name: 'Initial Subscription', quantity: 1, price: 0 }]),
        subtotal: '0',
        taxRate: '0',
        taxAmount: '0',
        discount: '0',
        total: '0',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ customer, invoice });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
} 