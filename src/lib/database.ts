import { sql } from '@vercel/postgres';

/**
 * Database utility functions for Vercel Postgres integration
 */

// Database connection validation
export async function validateDatabaseConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT 1 as test`;
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection validation failed:', error);
    return false;
  }
}

// Initialize database tables if they don't exist
export async function initializeDatabase(): Promise<void> {
  try {
    // Create sessions table for analytics and usage monitoring
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT NOW(),
        template_used VARCHAR(50),
        feature_used VARCHAR(50),
        success BOOLEAN,
        user_agent TEXT,
        ip_address INET
      )
    `;

    // Create error_logs table for debugging and monitoring
    await sql`
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT NOW(),
        error_type VARCHAR(100),
        error_message TEXT,
        stack_trace TEXT,
        user_agent TEXT,
        ip_address INET,
        request_url TEXT
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_feature_used ON sessions(feature_used);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}

// Types for database operations
export interface SessionData {
  id?: string;
  template_used?: string;
  feature_used: 'template-enhancer' | 'trainer';
  success: boolean;
  user_agent?: string;
  ip_address?: string;
}

export interface ErrorLogData {
  id?: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_agent?: string;
  ip_address?: string;
  request_url?: string;
}

export interface SessionStats {
  total_sessions: number;
  successful_sessions: number;
  template_enhancer_usage: number;
  trainer_usage: number;
  success_rate: number;
}

// Session tracking functions
export async function trackSession(sessionData: SessionData): Promise<string | null> {
  try {
    const result = await sql`
      INSERT INTO sessions (template_used, feature_used, success, user_agent, ip_address)
      VALUES (${sessionData.template_used || null}, ${sessionData.feature_used}, ${sessionData.success}, ${sessionData.user_agent || null}, ${sessionData.ip_address || null})
      RETURNING id
    `;
    
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to track session:', error);
    return null;
  }
}

export async function getSessionStats(days: number = 30): Promise<SessionStats | null> {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_sessions,
        COUNT(CASE WHEN feature_used = 'template-enhancer' THEN 1 END) as template_enhancer_usage,
        COUNT(CASE WHEN feature_used = 'trainer' THEN 1 END) as trainer_usage
      FROM sessions 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `;

    const row = result.rows[0];
    const totalSessions = parseInt(row.total_sessions);
    const successfulSessions = parseInt(row.successful_sessions);

    return {
      total_sessions: totalSessions,
      successful_sessions: successfulSessions,
      template_enhancer_usage: parseInt(row.template_enhancer_usage),
      trainer_usage: parseInt(row.trainer_usage),
      success_rate: totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0
    };
  } catch (error) {
    console.error('Failed to get session stats:', error);
    return null;
  }
}

// Error logging functions
export async function logError(errorData: ErrorLogData): Promise<string | null> {
  try {
    const result = await sql`
      INSERT INTO error_logs (error_type, error_message, stack_trace, user_agent, ip_address, request_url)
      VALUES (${errorData.error_type}, ${errorData.error_message}, ${errorData.stack_trace || null}, ${errorData.user_agent || null}, ${errorData.ip_address || null}, ${errorData.request_url || null})
      RETURNING id
    `;
    
    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Failed to log error:', error);
    return null;
  }
}

export async function getRecentErrors(limit: number = 50): Promise<ErrorLogData[]> {
  try {
    const result = await sql`
      SELECT id, created_at, error_type, error_message, stack_trace, user_agent, ip_address, request_url
      FROM error_logs 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;

    return result.rows.map(row => ({
      id: row.id,
      error_type: row.error_type,
      error_message: row.error_message,
      stack_trace: row.stack_trace,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
      request_url: row.request_url
    }));
  } catch (error) {
    console.error('Failed to get recent errors:', error);
    return [];
  }
}

// Database maintenance functions
export async function cleanupOldData(daysToKeep: number = 90): Promise<void> {
  try {
    // Clean up old sessions
    await sql`
      DELETE FROM sessions 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    // Clean up old error logs
    await sql`
      DELETE FROM error_logs 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    console.log(`Cleaned up data older than ${daysToKeep} days`);
  } catch (error) {
    console.error('Failed to cleanup old data:', error);
    throw error;
  }
}