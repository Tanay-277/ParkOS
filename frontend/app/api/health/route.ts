import { NextResponse } from 'next/server';
import { checkApiHealth } from '@/services/api';

export async function GET() {
  try {
    // Check if the backend is available
    const backendAvailable = await checkApiHealth();
    
    // Return health status
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
      environment: process.env.NODE_ENV,
      backend: backendAvailable ? 'connected' : 'disconnected'
    }, {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
    });
  }
}
