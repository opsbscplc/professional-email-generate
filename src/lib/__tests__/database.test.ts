import { sql } from '@vercel/postgres';
import {
  validateDatabaseConnection,
  initializeDatabase,
  trackSession,
  getSessionStats,
  logError,
  getRecentErrors,
  cleanupOldData,
  SessionData,
  ErrorLogData
} from '../database';

// Mock the @vercel/postgres module
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn()
}));

const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      mockSql.mockResolvedValueOnce({ rows: [{ test: 1 }] } as any);

      const result = await validateDatabaseConnection();

      expect(result).toBe(true);
      expect(mockSql).toHaveBeenCalledWith(['SELECT 1 as test']);
    });

    it('should return false when database connection fails', async () => {
      mockSql.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await validateDatabaseConnection();

      expect(result).toBe(false);
    });
  });

  describe('initializeDatabase', () => {
    it('should create tables and indexes successfully', async () => {
      mockSql.mockResolvedValue({ rows: [] } as any);

      await expect(initializeDatabase()).resolves.not.toThrow();

      // Verify that all table creation queries were called
      expect(mockSql).toHaveBeenCalledTimes(6); // 2 tables + 4 indexes
    });

    it('should throw error when table creation fails', async () => {
      mockSql.mockRejectedValueOnce(new Error('Table creation failed'));

      await expect(initializeDatabase()).rejects.toThrow('Table creation failed');
    });
  });

  describe('trackSession', () => {
    it('should successfully track a session and return session ID', async () => {
      const sessionData: SessionData = {
        template_used: 'professional',
        feature_used: 'template-enhancer',
        success: true,
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1'
      };

      mockSql.mockResolvedValueOnce({ 
        rows: [{ id: 'test-session-id' }] 
      } as any);

      const result = await trackSession(sessionData);

      expect(result).toBe('test-session-id');
      expect(mockSql).toHaveBeenCalledWith([
        '\n      INSERT INTO sessions (template_used, feature_used, success, user_agent, ip_address)\n      VALUES (',
        ', ',
        ', ',
        ', ',
        ', ',
        ')\n      RETURNING id\n    '
      ], 'professional', 'template-enhancer', true, 'Mozilla/5.0', '192.168.1.1');
    });

    it('should return null when session tracking fails', async () => {
      const sessionData: SessionData = {
        feature_used: 'trainer',
        success: false
      };

      mockSql.mockRejectedValueOnce(new Error('Insert failed'));

      const result = await trackSession(sessionData);

      expect(result).toBe(null);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      mockSql.mockResolvedValueOnce({
        rows: [{
          total_sessions: '100',
          successful_sessions: '85',
          template_enhancer_usage: '60',
          trainer_usage: '40'
        }]
      } as any);

      const result = await getSessionStats(30);

      expect(result).toEqual({
        total_sessions: 100,
        successful_sessions: 85,
        template_enhancer_usage: 60,
        trainer_usage: 40,
        success_rate: 85
      });
    });

    it('should return null when stats query fails', async () => {
      mockSql.mockRejectedValueOnce(new Error('Query failed'));

      const result = await getSessionStats(30);

      expect(result).toBe(null);
    });

    it('should handle zero sessions correctly', async () => {
      mockSql.mockResolvedValueOnce({
        rows: [{
          total_sessions: '0',
          successful_sessions: '0',
          template_enhancer_usage: '0',
          trainer_usage: '0'
        }]
      } as any);

      const result = await getSessionStats(30);

      expect(result?.success_rate).toBe(0);
    });
  });

  describe('logError', () => {
    it('should successfully log an error and return error ID', async () => {
      const errorData: ErrorLogData = {
        error_type: 'API_ERROR',
        error_message: 'Gemini API failed',
        stack_trace: 'Error stack trace',
        user_agent: 'Mozilla/5.0',
        ip_address: '192.168.1.1',
        request_url: '/api/gemini'
      };

      mockSql.mockResolvedValueOnce({ 
        rows: [{ id: 'test-error-id' }] 
      } as any);

      const result = await logError(errorData);

      expect(result).toBe('test-error-id');
    });

    it('should return null when error logging fails', async () => {
      const errorData: ErrorLogData = {
        error_type: 'TEST_ERROR',
        error_message: 'Test error message'
      };

      mockSql.mockRejectedValueOnce(new Error('Insert failed'));

      const result = await logError(errorData);

      expect(result).toBe(null);
    });
  });

  describe('getRecentErrors', () => {
    it('should return recent errors', async () => {
      const mockErrors = [
        {
          id: 'error-1',
          error_type: 'API_ERROR',
          error_message: 'Test error 1',
          stack_trace: null,
          user_agent: 'Mozilla/5.0',
          ip_address: '192.168.1.1',
          request_url: '/api/test'
        },
        {
          id: 'error-2',
          error_type: 'VALIDATION_ERROR',
          error_message: 'Test error 2',
          stack_trace: 'Stack trace',
          user_agent: 'Chrome/90.0',
          ip_address: '192.168.1.2',
          request_url: '/api/validate'
        }
      ];

      mockSql.mockResolvedValueOnce({ rows: mockErrors } as any);

      const result = await getRecentErrors(50);

      expect(result).toEqual(mockErrors);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when query fails', async () => {
      mockSql.mockRejectedValueOnce(new Error('Query failed'));

      const result = await getRecentErrors(50);

      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldData', () => {
    it('should successfully cleanup old data', async () => {
      mockSql.mockResolvedValue({ rows: [] } as any);

      await expect(cleanupOldData(90)).resolves.not.toThrow();

      expect(mockSql).toHaveBeenCalledTimes(2); // One for sessions, one for error_logs
    });

    it('should throw error when cleanup fails', async () => {
      mockSql.mockRejectedValueOnce(new Error('Cleanup failed'));

      await expect(cleanupOldData(90)).rejects.toThrow('Cleanup failed');
    });
  });
});