/**
 * Integration test to verify database setup works end-to-end
 * This test verifies that all database components work together correctly
 */

import { 
  validateDatabaseConnection, 
  initializeDatabase,
  trackSession,
  logError,
  getSessionStats,
  getRecentErrors,
  cleanupOldData
} from '../database';
import { trackSession as clientTrackSession, logClientError } from '../analytics';

// Mock the @vercel/postgres module for integration testing
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

// Mock fetch for client-side functions
global.fetch = jest.fn();

describe('Database Integration End-to-End', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle complete session tracking workflow', async () => {
    const { sql } = require('@vercel/postgres');
    
    // Mock successful database operations
    sql
      .mockResolvedValueOnce({ rows: [{ test: 1 }] }) // validateDatabaseConnection
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create sessions table
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create error_logs table
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create indexes
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create indexes
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create indexes
      .mockResolvedValueOnce({ rows: [] }) // initializeDatabase - create indexes
      .mockResolvedValueOnce({ rows: [{ id: 'session-123' }] }); // trackSession

    // Test database initialization
    const isConnected = await validateDatabaseConnection();
    expect(isConnected).toBe(true);

    await initializeDatabase();

    // Test session tracking
    const sessionId = await trackSession({
      template_used: 'professional',
      feature_used: 'template-enhancer',
      success: true,
      user_agent: 'Mozilla/5.0',
      ip_address: '192.168.1.1'
    });

    expect(sessionId).toBe('session-123');
    expect(sql).toHaveBeenCalledTimes(8);
  });

  it('should handle complete error logging workflow', async () => {
    const { sql } = require('@vercel/postgres');
    
    // Mock successful error logging
    sql.mockResolvedValueOnce({ rows: [{ id: 'error-456' }] });

    const errorId = await logError({
      error_type: 'API_ERROR',
      error_message: 'Gemini API failed',
      stack_trace: 'Error stack trace',
      user_agent: 'Mozilla/5.0',
      ip_address: '192.168.1.1',
      request_url: '/api/gemini'
    });

    expect(errorId).toBe('error-456');
    expect(sql).toHaveBeenCalledWith([
      '\n      INSERT INTO error_logs (error_type, error_message, stack_trace, user_agent, ip_address, request_url)\n      VALUES (',
      ', ',
      ', ',
      ', ',
      ', ',
      ', ',
      ')\n      RETURNING id\n    '
    ], 'API_ERROR', 'Gemini API failed', 'Error stack trace', 'Mozilla/5.0', '192.168.1.1', '/api/gemini');
  });

  it('should handle analytics and reporting workflow', async () => {
    const { sql } = require('@vercel/postgres');
    
    // Mock session stats query
    sql
      .mockResolvedValueOnce({
        rows: [{
          total_sessions: '150',
          successful_sessions: '120',
          template_enhancer_usage: '90',
          trainer_usage: '60'
        }]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'error-1',
            error_type: 'API_ERROR',
            error_message: 'Test error 1',
            stack_trace: null,
            user_agent: 'Mozilla/5.0',
            ip_address: '192.168.1.1',
            request_url: '/api/test'
          }
        ]
      });

    // Test getting session statistics
    const stats = await getSessionStats(30);
    expect(stats).toEqual({
      total_sessions: 150,
      successful_sessions: 120,
      template_enhancer_usage: 90,
      trainer_usage: 60,
      success_rate: 80
    });

    // Test getting recent errors
    const errors = await getRecentErrors(10);
    expect(errors).toHaveLength(1);
    expect(errors[0].error_type).toBe('API_ERROR');
  });

  it('should handle client-side integration with mocked API', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, session_id: 'client-session-123' })
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, error_id: 'client-error-456' })
      } as any);

    // Test client-side session tracking
    const sessionResult = await clientTrackSession({
      template_used: 'professional',
      feature_used: 'template-enhancer',
      success: true
    });

    expect(sessionResult).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_used: 'professional',
        feature_used: 'template-enhancer',
        success: true
      })
    });

    // Test client-side error logging
    const errorResult = await logClientError({
      error_type: 'CLIENT_ERROR',
      error_message: 'Client-side error occurred'
    });

    expect(errorResult).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_type: 'CLIENT_ERROR',
        error_message: 'Client-side error occurred'
      })
    });
  });

  it('should handle database maintenance workflow', async () => {
    const { sql } = require('@vercel/postgres');
    
    // Mock cleanup operations
    sql
      .mockResolvedValueOnce({ rows: [] }) // cleanup sessions
      .mockResolvedValueOnce({ rows: [] }); // cleanup error_logs

    await cleanupOldData(90);

    expect(sql).toHaveBeenCalledTimes(2);
    // Verify cleanup queries were called for both tables
    expect(sql).toHaveBeenNthCalledWith(1, [
      '\n      DELETE FROM sessions \n      WHERE created_at < NOW() - INTERVAL \'',
      ' days\'\n    '
    ], 90);
    expect(sql).toHaveBeenNthCalledWith(2, [
      '\n      DELETE FROM error_logs \n      WHERE created_at < NOW() - INTERVAL \'',
      ' days\'\n    '
    ], 90);
  });

  it('should handle error scenarios gracefully', async () => {
    const { sql } = require('@vercel/postgres');
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    
    // Mock database failures
    sql.mockRejectedValue(new Error('Database connection failed'));
    
    // Mock API failures
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error'
    } as any);

    // Test database error handling
    const isConnected = await validateDatabaseConnection();
    expect(isConnected).toBe(false);

    const sessionId = await trackSession({
      feature_used: 'trainer',
      success: false
    });
    expect(sessionId).toBe(null);

    // Test client-side error handling
    const clientResult = await clientTrackSession({
      feature_used: 'template-enhancer',
      success: false
    });
    expect(clientResult).toBe(false);
  });
});