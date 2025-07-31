import { NextRequest, NextResponse } from 'next/server';
import { logError, getRecentErrors, ErrorLogData } from '@/lib/database';
import { applySecurityHeaders, sanitizeInput } from '@/lib/security';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Log a new error
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error_type, error_message, stack_trace } = body;

    // Validate required fields
    if (!error_type || !error_message) {
      const response = NextResponse.json(
        { error: 'Missing required fields: error_type, error_message' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    // Sanitize inputs
    const sanitizedErrorType = sanitizeInput(error_type);
    const sanitizedErrorMessage = sanitizeInput(error_message);
    const sanitizedStackTrace = stack_trace ? sanitizeInput(stack_trace) : undefined;

    // Validate field lengths after sanitization
    if (sanitizedErrorType.length > 100) {
      const response = NextResponse.json(
        { error: 'error_type must be 100 characters or less' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    if (sanitizedErrorMessage.length > 5000) {
      const response = NextResponse.json(
        { error: 'error_message must be 5000 characters or less' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const errorData: ErrorLogData = {
      error_type: sanitizedErrorType,
      error_message: sanitizedErrorMessage,
      stack_trace: sanitizedStackTrace,
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: getClientIP(request),
      request_url: request.headers.get('referer') || undefined
    };

    const errorId = await logError(errorData);

    if (!errorId) {
      const response = NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      error_id: errorId,
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to log error:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

// Get recent errors (for debugging/monitoring)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate limit parameter
    if (limit < 1 || limit > 1000) {
      const response = NextResponse.json(
        { error: 'Limit parameter must be between 1 and 1000' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const errors = await getRecentErrors(limit);

    const response = NextResponse.json({
      success: true,
      data: errors,
      count: errors.length,
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to get recent errors:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}