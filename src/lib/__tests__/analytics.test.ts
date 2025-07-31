import {
  trackSession,
  logClientError,
  getSessionStats,
  checkDatabaseHealth,
  initializeDatabase
} from '../analytics';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Analytics Client Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackSession', () => {
    it('should successfully track a session', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const sessionData = {
        template_used: 'professional',
        feature_used: 'template-enhancer' as const,
        success: true
      };

      const result = await trackSession(sessionData);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
    });

    it('should return false when API request fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Bad Request'
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const sessionData = {
        feature_used: 'trainer' as const,
        success: false
      };

      const result = await trackSession(sessionData);

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const sessionData = {
        feature_used: 'template-enhancer' as const,
        success: true
      };

      const result = await trackSession(sessionData);

      expect(result).toBe(false);
    });
  });

  describe('logClientError', () => {
    it('should successfully log an error', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const errorData = {
        error_type: 'API_ERROR',
        error_message: 'Gemini API failed',
        stack_trace: 'Error stack trace'
      };

      const result = await logClientError(errorData);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    });

    it('should return false when API request fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const errorData = {
        error_type: 'TEST_ERROR',
        error_message: 'Test error message'
      };

      const result = await logClientError(errorData);

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const errorData = {
        error_type: 'NETWORK_ERROR',
        error_message: 'Network request failed'
      };

      const result = await logClientError(errorData);

      expect(result).toBe(false);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      const mockStats = {
        total_sessions: 100,
        successful_sessions: 85,
        template_enhancer_usage: 60,
        trainer_usage: 40,
        success_rate: 85
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: mockStats })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await getSessionStats(30);

      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics?days=30');
    });

    it('should use default days parameter', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, data: {} })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await getSessionStats();

      expect(mockFetch).toHaveBeenCalledWith('/api/analytics?days=30');
    });

    it('should return null when API request fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await getSessionStats(7);

      expect(result).toBe(null);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getSessionStats(7);

      expect(result).toBe(null);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when database is healthy', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await checkDatabaseHealth();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/health');
    });

    it('should return false when database is unhealthy', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'error' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await checkDatabaseHealth();

      expect(result).toBe(false);
    });

    it('should return false when API request fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Service Unavailable'
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await checkDatabaseHealth();

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkDatabaseHealth();

      expect(result).toBe(false);
    });
  });

  describe('initializeDatabase', () => {
    it('should return true when database initialization succeeds', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'success' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await initializeDatabase();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'POST',
      });
    });

    it('should return false when database initialization fails', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'error' })
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await initializeDatabase();

      expect(result).toBe(false);
    });

    it('should return false when API request fails', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      };
      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await initializeDatabase();

      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await initializeDatabase();

      expect(result).toBe(false);
    });
  });
});