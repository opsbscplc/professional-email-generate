import { NextRequest } from 'next/server'
import { POST as geminiPost } from '../gemini/route'
import { POST as analyticsPost, GET as analyticsGet } from '../analytics/route'
import { POST as errorsPost, GET as errorsGet } from '../errors/route'
import { GET as healthGet } from '../health/route'

// Mock the security module
jest.mock('../../../lib/security', () => ({
  sanitizeEmailContent: jest.fn((content) => {
    if (!content || content.trim().length === 0) {
      throw new Error('Email content cannot be empty')
    }
    if (content.length > 10000) {
      throw new Error('Email content too long')
    }
    if (content.includes('<script>')) {
      return content.replace(/<script>.*?<\/script>/g, '')
    }
    return content
  }),
  sanitizeInput: jest.fn((input) => {
    if (!input) return ''
    return input.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '')
  }),
  validateApiKeyFormat: jest.fn((key) => {
    if (!key) return { isValid: false, error: 'API key is required' }
    if (key.length < 20) return { isValid: false, error: 'Invalid API key format' }
    if (!key.startsWith('AI')) return { isValid: false, error: 'Invalid API key format' }
    return { isValid: true }
  }),
  applySecurityHeaders: jest.fn((response) => response),
}))

// Mock the database module
jest.mock('../../../lib/database', () => ({
  trackSession: jest.fn(() => Promise.resolve('session-123')),
  getSessionStats: jest.fn(() => Promise.resolve({ total: 10, success: 8 })),
  logError: jest.fn(() => Promise.resolve('error-123')),
  getRecentErrors: jest.fn(() => Promise.resolve([])),
  validateDatabaseConnection: jest.fn(() => Promise.resolve(true)),
  initializeDatabase: jest.fn(() => Promise.resolve()),
}))

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Enhanced email content'
        }
      })
    })
  }))
}))

// Helper to create mock NextRequest
const createMockRequest = (
  body: any,
  headers: Record<string, string> = {},
  url: string = 'http://localhost:3000/api/test'
): NextRequest => {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (key: string) => headers[key] || null,
    },
    url,
  } as unknown as NextRequest
}

describe('API Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Gemini API Security', () => {
    it('should sanitize email content input', async () => {
      const { sanitizeEmailContent } = require('../../../lib/security')
      
      const request = createMockRequest(
        {
          prompt: 'Hello <script>alert("xss")</script> World',
          template: 'professional'
        },
        { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
      )

      await geminiPost(request)

      expect(sanitizeEmailContent).toHaveBeenCalledWith('Hello <script>alert("xss")</script> World')
    })

    it('should validate API key format', async () => {
      const { validateApiKeyFormat } = require('../../../lib/security')
      
      const request = createMockRequest(
        { prompt: 'Hello World' },
        { authorization: 'Bearer invalid-key' }
      )

      await geminiPost(request)

      expect(validateApiKeyFormat).toHaveBeenCalledWith('invalid-key')
    })

    it('should reject requests with malicious content', async () => {
      const { sanitizeEmailContent } = require('../../../lib/security')
      sanitizeEmailContent.mockImplementation(() => {
        throw new Error('Email content cannot be empty')
      })

      const request = createMockRequest(
        { prompt: '<script>alert("xss")</script>' },
        { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
      )

      const response = await geminiPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
    })

    it('should sanitize training data', async () => {
      const { sanitizeEmailContent } = require('../../../lib/security')
      
      const request = createMockRequest(
        {
          prompt: 'Test input',
          trainingData: {
            input: 'Training <script>alert("xss")</script> input',
            output: 'Training output'
          }
        },
        { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
      )

      await geminiPost(request)

      expect(sanitizeEmailContent).toHaveBeenCalledWith('Training <script>alert("xss")</script> input')
      expect(sanitizeEmailContent).toHaveBeenCalledWith('Training output')
    })

    it('should apply security headers to responses', async () => {
      const { applySecurityHeaders } = require('../../../lib/security')
      
      const request = createMockRequest(
        { prompt: 'Hello World' },
        { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
      )

      await geminiPost(request)

      expect(applySecurityHeaders).toHaveBeenCalled()
    })
  })

  describe('Analytics API Security', () => {
    it('should sanitize analytics input', async () => {
      const { sanitizeInput } = require('../../../lib/security')
      
      const request = createMockRequest({
        feature_used: 'template-enhancer<script>alert("xss")</script>',
        success: true
      })

      await analyticsPost(request)

      expect(sanitizeInput).toHaveBeenCalledWith('template-enhancer<script>alert("xss")</script>')
    })

    it('should validate analytics input values', async () => {
      const request = createMockRequest({
        feature_used: 'invalid-feature',
        success: true
      })

      const response = await analyticsPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Invalid feature_used value')
    })

    it('should apply security headers to analytics responses', async () => {
      const { applySecurityHeaders } = require('../../../lib/security')
      
      const request = createMockRequest({
        feature_used: 'template-enhancer',
        success: true
      })

      await analyticsPost(request)

      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should validate query parameters in GET requests', async () => {
      const request = createMockRequest(
        {},
        {},
        'http://localhost:3000/api/analytics?days=9999'
      )

      const response = await analyticsGet(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Days parameter must be between 1 and 365')
    })
  })

  describe('Errors API Security', () => {
    it('should sanitize error input', async () => {
      const { sanitizeInput } = require('../../../lib/security')
      
      const request = createMockRequest({
        error_type: 'validation<script>alert("xss")</script>',
        error_message: 'Error message with <script>alert("xss")</script>',
        stack_trace: 'Stack trace with <script>alert("xss")</script>'
      })

      await errorsPost(request)

      expect(sanitizeInput).toHaveBeenCalledWith('validation<script>alert("xss")</script>')
      expect(sanitizeInput).toHaveBeenCalledWith('Error message with <script>alert("xss")</script>')
      expect(sanitizeInput).toHaveBeenCalledWith('Stack trace with <script>alert("xss")</script>')
    })

    it('should validate error field lengths', async () => {
      const longErrorType = 'a'.repeat(101)
      const request = createMockRequest({
        error_type: longErrorType,
        error_message: 'Valid message'
      })

      const response = await errorsPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('error_type must be 100 characters or less')
    })

    it('should validate error message length', async () => {
      const longErrorMessage = 'a'.repeat(5001)
      const request = createMockRequest({
        error_type: 'validation',
        error_message: longErrorMessage
      })

      const response = await errorsPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('error_message must be 5000 characters or less')
    })

    it('should validate GET request parameters', async () => {
      const request = createMockRequest(
        {},
        {},
        'http://localhost:3000/api/errors?limit=9999'
      )

      const response = await errorsGet(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Limit parameter must be between 1 and 1000')
    })
  })

  describe('Health API Security', () => {
    it('should apply security headers to health responses', async () => {
      const { applySecurityHeaders } = require('../../../lib/security')
      
      const request = createMockRequest({})

      await healthGet(request)

      expect(applySecurityHeaders).toHaveBeenCalled()
    })

    it('should handle database connection errors securely', async () => {
      const { validateDatabaseConnection } = require('../../../lib/database')
      validateDatabaseConnection.mockResolvedValue(false)

      const request = createMockRequest({})
      const response = await healthGet(request)
      const responseData = await response.json()

      expect(response.status).toBe(503)
      expect(responseData.status).toBe('error')
      expect(responseData.message).toBe('Database connection failed')
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle null/undefined inputs', async () => {
      const request = createMockRequest(
        { prompt: null },
        { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
      )

      const response = await geminiPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Prompt is required')
    })

    it('should handle empty objects', async () => {
      const request = createMockRequest({})

      const response = await analyticsPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toContain('Missing required fields')
    })

    it('should handle malformed JSON gracefully', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: {
          get: () => null,
        },
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest

      const response = await geminiPost(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })
  })

  describe('Security Headers Application', () => {
    it('should apply security headers to all API responses', async () => {
      const { applySecurityHeaders } = require('../../../lib/security')
      
      const apis = [
        () => geminiPost(createMockRequest(
          { prompt: 'test' },
          { authorization: 'Bearer AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK' }
        )),
        () => analyticsPost(createMockRequest({ feature_used: 'template-enhancer', success: true })),
        () => errorsPost(createMockRequest({ error_type: 'test', error_message: 'test' })),
        () => healthGet(createMockRequest({})),
      ]

      for (const apiCall of apis) {
        await apiCall()
        expect(applySecurityHeaders).toHaveBeenCalled()
      }
    })
  })
})