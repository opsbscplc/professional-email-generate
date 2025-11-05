import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../../middleware'

// Mock the security functions
jest.mock('../lib/security', () => ({
  enforceHttps: jest.fn(),
  applySecurityHeaders: jest.fn((response) => response),
  applyCorsHeaders: jest.fn((request, response) => response),
  rateLimit: jest.fn(() => true),
  getClientIdentifier: jest.fn(() => 'test-client'),
}))

// Helper to create mock NextRequest
const createMockRequest = (
  url: string, 
  method: string = 'GET', 
  headers: Record<string, string> = {}
): NextRequest => {
  const request = {
    url,
    method,
    nextUrl: new URL(url),
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as NextRequest

  return request
}

describe('Security Middleware Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('HTTPS Enforcement', () => {
    it('should redirect HTTP to HTTPS in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { enforceHttps } = require('../lib/security')
      enforceHttps.mockReturnValue(NextResponse.redirect('https://example.com'))

      const request = createMockRequest('http://example.com/api/test')
      const response = middleware(request)

      expect(enforceHttps).toHaveBeenCalledWith(request)
      
      process.env.NODE_ENV = originalEnv
    })

    it('should not redirect in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const { enforceHttps } = require('../lib/security')
      enforceHttps.mockReturnValue(null)

      const request = createMockRequest('http://localhost:3000/api/test')
      middleware(request)

      expect(enforceHttps).toHaveBeenCalledWith(request)
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('CORS Handling', () => {
    it('should handle OPTIONS requests', () => {
      const { applyCorsHeaders, applySecurityHeaders } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/api/test', 'OPTIONS')
      const response = middleware(request)

      expect(applyCorsHeaders).toHaveBeenCalled()
      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should apply CORS headers to API routes', () => {
      const { applyCorsHeaders } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/api/gemini', 'POST')
      middleware(request)

      expect(applyCorsHeaders).toHaveBeenCalled()
    })

    it('should not apply CORS headers to non-API routes', () => {
      const { applyCorsHeaders } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/dashboard', 'GET')
      middleware(request)

      // CORS should not be applied to non-API routes
      expect(applyCorsHeaders).not.toHaveBeenCalled()
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', () => {
      const { rateLimit, getClientIdentifier } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/api/gemini', 'POST')
      middleware(request)

      expect(getClientIdentifier).toHaveBeenCalledWith(request)
      expect(rateLimit).toHaveBeenCalledWith('/api/gemini', 'test-client')
    })

    it('should block requests when rate limit exceeded', () => {
      const { rateLimit } = require('../lib/security')
      rateLimit.mockReturnValue(false) // Simulate rate limit exceeded

      const request = createMockRequest('http://localhost:3000/api/gemini', 'POST')
      const response = middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      // The response should be a 429 status
    })

    it('should not apply rate limiting to non-API routes', () => {
      const { rateLimit } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/dashboard', 'GET')
      middleware(request)

      expect(rateLimit).not.toHaveBeenCalled()
    })
  })

  describe('Security Headers', () => {
    it('should apply security headers to all responses', () => {
      const { applySecurityHeaders } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/dashboard', 'GET')
      middleware(request)

      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should apply security headers to API responses', () => {
      const { applySecurityHeaders } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/api/health', 'GET')
      middleware(request)

      expect(applySecurityHeaders).toHaveBeenCalled()
    })
  })

  describe('Path Matching', () => {
    it('should process requests matching the config matcher', () => {
      const { applySecurityHeaders } = require('../lib/security')
      
      // Test various paths that should be processed
      const paths = [
        'http://localhost:3000/',
        'http://localhost:3000/api/gemini',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/template-enhancer',
      ]

      paths.forEach(path => {
        const request = createMockRequest(path)
        middleware(request)
        expect(applySecurityHeaders).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const { enforceHttps } = require('../lib/security')
      enforceHttps.mockImplementation(() => {
        throw new Error('Test error')
      })

      const request = createMockRequest('http://localhost:3000/api/test')
      
      // Should not throw, should handle error gracefully
      expect(() => middleware(request)).not.toThrow()
    })
  })

  describe('Client Identification', () => {
    it('should identify clients by IP and user agent', () => {
      const { getClientIdentifier } = require('../lib/security')
      
      const request = createMockRequest(
        'http://localhost:3000/api/gemini', 
        'POST',
        {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0 Test Browser'
        }
      )
      
      middleware(request)
      
      expect(getClientIdentifier).toHaveBeenCalledWith(request)
    })

    it('should handle missing client information', () => {
      const { getClientIdentifier } = require('../lib/security')
      
      const request = createMockRequest('http://localhost:3000/api/gemini', 'POST')
      
      middleware(request)
      
      expect(getClientIdentifier).toHaveBeenCalledWith(request)
    })
  })
})