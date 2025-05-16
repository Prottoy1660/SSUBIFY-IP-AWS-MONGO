import { testConnection } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const isConnected = await testConnection();
    return NextResponse.json({ 
      success: true, 
      connected: isConnected,
      message: isConnected ? 'Successfully connected to MongoDB' : 'Failed to connect to MongoDB'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      connected: false,
      message: 'Error testing database connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 