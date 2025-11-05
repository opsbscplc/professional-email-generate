import { NextRequest, NextResponse } from 'next/server';
import { validateDatabaseConnection, initializeDatabase } from '@/lib/database';
import { applySecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const isConnected = await validateDatabaseConnection();
    
    if (!isConnected) {
      const response = NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Health check failed:', error);
    const response = NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    const response = NextResponse.json({
      status: 'success',
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Database initialization failed:', error);
    const response = NextResponse.json(
      { 
        status: 'error', 
        message: 'Database initialization failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}