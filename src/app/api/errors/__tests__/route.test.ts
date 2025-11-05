import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { logError, getRecentErrors } from '@/lib/database';

// Mock the database functions
jest.mock('@/lib/database', () => ({
  logError: jest.fn(),
  getRecentErrors: jest.fn()
}));

const mockLogError = logError as jest.MockedFunction<typeof logError>;
const mockGetRecentErrors = getRecentErrors as jest.MockedFunction<typeof getRecentErrors>;

describe('/api/errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/errors', () => {
    it('should successfully log an error', async () => {
      mockLogError.mockResolvedValueOnce('test-error-id');

      const requestBody = {
        error_type: 'API_ERROR',
        error_message: 'Gemini API failed',
        stack_trace: 'Error stack trace'
      };

      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'X-Forwarded-For': '192.168.1.1',
          'Referer': 'http://localhost:3000/template-enhancer'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.error_id).toBe('test-error-id');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const requestBody = {
        error_type: 'API_ERROR'
        // Missing error_message
      };

      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: error_type, error_message');
    });

    it('should validate error_type length', async () => {
      const requestBody = {
        error_type: 'A'.repeat(101), // 101 characters
        error_message: 'Test error message'
      };

      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('error_type must be 100 characters or less');
    });

    it('should validate error_message length', async () => {
      const requestBody = {
        error_type: 'TEST_ERROR',
        error_message: 'A'.repeat(5001) // 5001 characters
      };

      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('error_message must be 5000 characters or less');
    });

    it('should handle database logging failure', async () => {
      mockLogError.mockResolvedValueOnce(null);

      const requestBody = {
        error_type: 'TEST_ERROR',
        error_message: 'Test error message'
      };

      const request = new NextRequest('http://localhost:3000/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to log error');
    });
  });

  describe('GET /api/errors', () => {
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

      mockGetRecentErrors.mockResolvedValueOnce(mockErrors);

      const request = new NextRequest('http://localhost:3000/api/errors?limit=50');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockErrors);
      expect(data.count).toBe(2);
      expect(data.timestamp).toBeDefined();
    });

    it('should use default limit parameter', async () => {
      mockGetRecentErrors.mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/errors');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGetRecentErrors).toHaveBeenCalledWith(50);
    });

    it('should validate limit parameter range', async () => {
      const request = new NextRequest('http://localhost:3000/api/errors?limit=2000');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Limit parameter must be between 1 and 1000');
    });

    it('should handle database query failure', async () => {
      mockGetRecentErrors.mockRejectedValueOnce(new Error('Query failed'));

      const request = new NextRequest('http://localhost:3000/api/errors?limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});