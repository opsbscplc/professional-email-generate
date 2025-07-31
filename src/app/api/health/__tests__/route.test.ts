import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { validateDatabaseConnection, initializeDatabase } from '@/lib/database';

// Mock the database functions
jest.mock('@/lib/database', () => ({
  validateDatabaseConnection: jest.fn(),
  initializeDatabase: jest.fn()
}));

const mockValidateConnection = validateDatabaseConnection as jest.MockedFunction<typeof validateDatabaseConnection>;
const mockInitializeDatabase = initializeDatabase as jest.MockedFunction<typeof initializeDatabase>;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when database is connected', async () => {
      mockValidateConnection.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
      expect(data.timestamp).toBeDefined();
    });

    it('should return error status when database connection fails', async () => {
      mockValidateConnection.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Database connection failed');
    });

    it('should handle database validation errors', async () => {
      mockValidateConnection.mockRejectedValueOnce(new Error('Connection error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Health check failed');
    });
  });

  describe('POST /api/health', () => {
    it('should successfully initialize database', async () => {
      mockInitializeDatabase.mockResolvedValueOnce(undefined);

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('success');
      expect(data.message).toBe('Database initialized successfully');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle database initialization errors', async () => {
      mockInitializeDatabase.mockRejectedValueOnce(new Error('Initialization failed'));

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'POST'
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.message).toBe('Database initialization failed');
      expect(data.error).toBe('Initialization failed');
    });
  });
});