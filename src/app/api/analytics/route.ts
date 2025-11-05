import { NextRequest, NextResponse } from 'next/server';
import { trackSession, getSessionStats, logError, SessionData, ErrorLogData } from '@/lib/database';
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

// Track a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_used, feature_used, success } = body;

    // Validate required fields
    if (!feature_used || typeof success !== 'boolean') {
      const response = NextResponse.json(
        { error: 'Missing required fields: feature_used, success' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    // Sanitize and validate feature_used value
    const sanitizedFeatureUsed = sanitizeInput(feature_used);
    if (!['template-enhancer', 'trainer'].includes(sanitizedFeatureUsed)) {
      const response = NextResponse.json(
        { error: 'Invalid feature_used value. Must be "template-enhancer" or "trainer"' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const sessionData: SessionData = {
      template_used: template_used ? sanitizeInput(template_used) : undefined,
      feature_used: sanitizedFeatureUsed as 'template-enhancer' | 'trainer',
      success,
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: getClientIP(request)
    };

    const sessionId = await trackSession(sessionData);

    if (!sessionId) {
      const response = NextResponse.json(
        { error: 'Failed to track session' },
        { status: 500 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to track session:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}

// Get session statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Validate days parameter
    if (days < 1 || days > 365) {
      const response = NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
      return applySecurityHeaders(response);
    }

    const stats = await getSessionStats(days);

    if (!stats) {
      const response = NextResponse.json(
        { error: 'Failed to retrieve session statistics' },
        { status: 500 }
      );
      return applySecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      data: stats,
      period_days: days,
      timestamp: new Date().toISOString()
    });
    return applySecurityHeaders(response);
  } catch (error) {
    console.error('Failed to get session stats:', error);
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return applySecurityHeaders(response);
  }
}