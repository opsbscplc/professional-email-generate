import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { trackSession, getSessionStats } from '@/lib/database';

// Mock the database functions
jest.mock('@/lib/database', () => ({
  trackSession: jest.fn(),
  getSessionStats: jest.fn()
}));

const mockTrackSession = trackSession as jest.MockedFunction<typeof trackSession>;
const mockGetSessionStats = getSessionStats as jest.MockedFunction<typeof getSessionStats>;

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/analytics', () => {
    it('should successfully track a session', async () => {
      mockTrackSession.mockResolvedValueOnce('test-session-id');

      const requestBody = {
        template_used: 'professional',
        feature_used: 'template-enhancer',
        success: true
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session_id).toBe('test-session-id');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const requestBody = {
        template_used: 'professional'
        // Missing feature_used and success
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: feature_used, success');
    });

    it('should validate feature_used value', async () => {
      const requestBody = {
        feature_used: 'invalid-feature',
        success: true
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid feature_used value. Must be "template-enhancer" or "trainer"');
    });

    it('should handle database tracking failure', async () => {
      mockTrackSession.mockResolvedValueOnce(null);

      const requestBody = {
        feature_used: 'trainer',
        success: false
      };

      const request = new NextRequest('http://localhost:3000/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to track session');
    });
  });

  describe('GET /api/analytics', () => {
    it('should return session statistics', async () => {
      const mockStats = {
        total_sessions: 100,
        successful_sessions: 85,
        template_enhancer_usage: 60,
        trainer_usage: 40,
        success_rate: 85
      };

      mockGetSessionStats.mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost:3000/api/analytics?days=30');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStats);
      expect(data.period_days).toBe(30);
      expect(data.timestamp).toBeDefined();
    });

    it('should use default days parameter', async () => {
      const mockStats = {
        total_sessions: 50,
        successful_sessions: 40,
        template_enhancer_usage: 30,
        trainer_usage: 20,
        success_rate: 80
      };

      mockGetSessionStats.mockResolvedValueOnce(mockStats);

      const request = new NextRequest('http://localhost:3000/api/analytics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.period_days).toBe(30);
      expect(mockGetSessionStats).toHaveBeenCalledWith(30);
    });

    it('should validate days parameter range', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics?days=500');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Days parameter must be between 1 and 365');
    });

    it('should handle database stats failure', async () => {
      mockGetSessionStats.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/analytics?days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve session statistics');
    });
  });
});