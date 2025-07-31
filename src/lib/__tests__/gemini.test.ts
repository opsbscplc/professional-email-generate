/**
 * @jest-environment jsdom
 */
import {
  validateApiKeyFormat,
  testApiKey,
  enhanceEmailWithTemplate,
  generateEmailWithTraining,
  getErrorMessage,
  geminiRateLimiter,
  makeRateLimitedRequest
} from '../gemini'
import { EmailTemplate } from '@/types/gemini'

// Mock fetch globally
global.fetch = jest.fn()

describe('Gemini Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset rate limiter
    ;(geminiRateLimiter as any).requests = []
  })

  describe('validateApiKeyFormat', () => {
    it('should validate correct API key format', () => {
      expect(validateApiKeyFormat('AIzaSyTest123456789012345')).toBe(true)
      expect(validateApiKeyFormat('AIzaSyAnotherValidKey123456')).toBe(true)
    })

    it('should reject invalid API key formats', () => {
      expect(validateApiKeyFormat('')).toBe(false)
      expect(validateApiKeyFormat('short')).toBe(false)
      expect(validateApiKeyFormat('NotStartingWithAI123456789')).toBe(false)
      expect(validateApiKeyFormat('AI-too-short')).toBe(false)
      expect(validateApiKeyFormat(123 as any)).toBe(false)
    })
  })

  describe('testApiKey', () => {
    it('should return valid for correct API key', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      const result = await testApiKey('AIzaSyTest123456789012345')

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'AIzaSyTest123456789012345' })
      })
    })

    it('should return invalid for incorrect API key format', async () => {
      const result = await testApiKey('invalid-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key format')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle API validation failure', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid API key' })
      } as Response)

      const result = await testApiKey('AIzaSyTest123456789012345')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('should handle network errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await testApiKey('AIzaSyTest123456789012345')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Network error during API key validation')
    })
  })

  describe('enhanceEmailWithTemplate', () => {
    it('should successfully enhance email with template', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'Enhanced email content' })
      } as Response)

      const result = await enhanceEmailWithTemplate(
        'AIzaSyTest123456789012345',
        'Original email',
        EmailTemplate.PROFESSIONAL
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('Enhanced email content')
      expect(mockFetch).toHaveBeenCalledWith('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'AIzaSyTest123456789012345',
          prompt: 'Original email',
          template: EmailTemplate.PROFESSIONAL
        })
      })
    })

    it('should validate API key format', async () => {
      const result = await enhanceEmailWithTemplate(
        'invalid-key',
        'Original email',
        EmailTemplate.PROFESSIONAL
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key format')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate email content', async () => {
      const result = await enhanceEmailWithTemplate(
        'AIzaSyTest123456789012345',
        '   ',
        EmailTemplate.PROFESSIONAL
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email content is required')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await enhanceEmailWithTemplate(
        'AIzaSyTest123456789012345',
        'Original email',
        EmailTemplate.PROFESSIONAL
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error during email enhancement')
    })
  })

  describe('validateTrainingDataClient', () => {
    it('should validate complete training data', () => {
      const result = validateTrainingDataClient(
        { input: 'Training input example', output: 'Training output example' },
        'Test input'
      )

      expect(result.isValid).toBe(true)
      expect(result.suggestions).toBeDefined()
    })

    it('should reject missing training input', () => {
      const result = validateTrainingDataClient(
        { input: '', output: 'Training output' },
        'Test input'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Both training input and output are required')
    })

    it('should reject missing training output', () => {
      const result = validateTrainingDataClient(
        { input: 'Training input', output: '' },
        'Test input'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Both training input and output are required')
    })

    it('should reject missing test input', () => {
      const result = validateTrainingDataClient(
        { input: 'Training input', output: 'Training output' },
        ''
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Test input is required')
    })

    it('should reject short training input', () => {
      const result = validateTrainingDataClient(
        { input: 'short', output: 'Training output example' },
        'Test input'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 10 characters long')
    })

    it('should reject short training output', () => {
      const result = validateTrainingDataClient(
        { input: 'Training input example', output: 'short' },
        'Test input'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 10 characters long')
    })

    it('should reject short test input', () => {
      const result = validateTrainingDataClient(
        { input: 'Training input example', output: 'Training output example' },
        'hi'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('at least 5 characters long')
    })

    it('should reject identical training input and output', () => {
      const identical = 'This is the same content'
      const result = validateTrainingDataClient(
        { input: identical, output: identical },
        'Test input'
      )

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('identical')
      expect(result.suggestions).toBeDefined()
    })

    it('should provide helpful suggestions', () => {
      const result = validateTrainingDataClient(
        { input: 'hey can u help', output: 'Hello, could you please help me?' },
        'Test input'
      )

      expect(result.isValid).toBe(true)
      expect(result.suggestions).toContain('Good: Your example shows how to make greetings more formal')
    })

    it('should detect politeness improvements', () => {
      const result = validateTrainingDataClient(
        { input: 'send me the report', output: 'Could you please send me the report?' },
        'Test input'
      )

      expect(result.isValid).toBe(true)
      expect(result.suggestions).toContain('Good: Your example shows how to add politeness')
    })

    it('should detect content expansion', () => {
      const result = validateTrainingDataClient(
        { input: 'need help', output: 'I need assistance with this task. Could you please help me when you have time? Thank you.' },
        'Test input'
      )

      expect(result.isValid).toBe(true)
      expect(result.suggestions).toContain('Your training shows how to expand and elaborate on content')
    })

    it('should detect content condensation', () => {
      const result = validateTrainingDataClient(
        { input: 'I would really appreciate it if you could possibly help me with this task when you have some free time available', output: 'Please help me with this task.' },
        'Test input'
      )

      expect(result.isValid).toBe(true)
      expect(result.suggestions).toContain('Your training shows how to make content more concise')
    })
  })

  describe('generateEmailWithTraining', () => {
    it('should successfully generate email with training data', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'Generated email content' })
      } as Response)

      const result = await generateEmailWithTraining(
        'AIzaSyTest123456789012345',
        'Test input',
        { input: 'Training input example', output: 'Training output example' }
      )

      expect(result.success).toBe(true)
      expect(result.data).toBe('Generated email content')
      expect(mockFetch).toHaveBeenCalledWith('/api/gemini', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer AIzaSyTest123456789012345'
        },
        body: JSON.stringify({
          prompt: 'Test input',
          trainingData: { input: 'Training input example', output: 'Training output example' }
        })
      })
    })

    it('should validate training data on client side', async () => {
      const result = await generateEmailWithTraining(
        'AIzaSyTest123456789012345',
        'Test input',
        { input: '', output: 'Training output' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Both training input and output are required')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate test input on client side', async () => {
      const result = await generateEmailWithTraining(
        'AIzaSyTest123456789012345',
        '   ',
        { input: 'Training input example', output: 'Training output example' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Test input is required')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should validate API key format', async () => {
      const result = await generateEmailWithTraining(
        'invalid-key',
        'Test input',
        { input: 'Training input example', output: 'Training output example' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid API key format')
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should handle network errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await generateEmailWithTraining(
        'AIzaSyTest123456789012345',
        'Test input',
        { input: 'Training input example', output: 'Training output example' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error during email generation')
    })

    it('should handle API errors', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Training pattern not clear' })
      } as Response)

      const result = await generateEmailWithTraining(
        'AIzaSyTest123456789012345',
        'Test input',
        { input: 'Training input example', output: 'Training output example' }
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Training pattern not clear')
    })
  })

  describe('getErrorMessage', () => {
    it('should return user-friendly error messages', () => {
      expect(getErrorMessage('Invalid API key')).toContain('check your Google Gemini API key')
      expect(getErrorMessage('Permission denied')).toContain('necessary permissions')
      expect(getErrorMessage('API quota exceeded')).toContain('usage limit')
      expect(getErrorMessage('Request timed out')).toContain('took too long')
      expect(getErrorMessage('Content violates safety policies')).toContain('safety policies')
      expect(getErrorMessage('Network error')).toContain('internet connection')
    })

    it('should return original error for unknown errors', () => {
      const unknownError = 'Some unknown error message'
      expect(getErrorMessage(unknownError)).toBe(unknownError)
    })

    it('should handle empty error messages', () => {
      expect(getErrorMessage('')).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ success: true })

      const result = await makeRateLimitedRequest(mockRequest)

      expect(result).toEqual({ success: true })
      expect(mockRequest).toHaveBeenCalled()
    })

    it('should block requests when rate limit exceeded', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ success: true })

      // Make maximum allowed requests
      for (let i = 0; i < 10; i++) {
        await makeRateLimitedRequest(mockRequest)
      }

      // This request should be blocked
      const result = await makeRateLimitedRequest(mockRequest)

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Rate limit exceeded')
      })
      expect(mockRequest).toHaveBeenCalledTimes(10) // Should not be called for the 11th time
    })

    it('should reset rate limit after time window', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ success: true })

      // Fill up the rate limit
      for (let i = 0; i < 10; i++) {
        await makeRateLimitedRequest(mockRequest)
      }

      // Manually reset the rate limiter by clearing old requests
      ;(geminiRateLimiter as any).requests = []

      // This should now work
      const result = await makeRateLimitedRequest(mockRequest)

      expect(result).toEqual({ success: true })
      expect(mockRequest).toHaveBeenCalledTimes(11)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete template enhancement workflow', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock API key test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Mock email enhancement
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'Professional email content' })
      } as Response)

      const apiKey = 'AIzaSyTest123456789012345'
      
      // Test API key
      const keyTest = await testApiKey(apiKey)
      expect(keyTest.valid).toBe(true)

      // Enhance email
      const enhancement = await enhanceEmailWithTemplate(
        apiKey,
        'hey can u send me that thing',
        EmailTemplate.PROFESSIONAL
      )

      expect(enhancement.success).toBe(true)
      expect(enhancement.data).toBe('Professional email content')
    })

    it('should handle complete training workflow', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock API key test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)

      // Mock training generation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: 'Generated response based on training' })
      } as Response)

      const apiKey = 'AIzaSyTest123456789012345'
      
      // Test API key
      const keyTest = await testApiKey(apiKey)
      expect(keyTest.valid).toBe(true)

      // Generate with training
      const generation = await generateEmailWithTraining(
        apiKey,
        'New input to process',
        { input: 'Example input', output: 'Example output' }
      )

      expect(generation.success).toBe(true)
      expect(generation.data).toBe('Generated response based on training')
    })
  })
})