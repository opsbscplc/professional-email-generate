/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'
import { EmailTemplate } from '@/types/gemini'

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation((apiKey: string) => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation((prompt: string) => {
        // Simulate different responses based on API key
        if (apiKey.includes('INVALID_KEY')) {
          throw new Error('API_KEY_INVALID')
        }
        if (apiKey === 'AIzaSyPERMISSION_DENIED_KEY123') {
          throw new Error('PERMISSION_DENIED')
        }
        if (apiKey === 'AIzaSyQUOTA_EXCEEDED_KEY123456') {
          throw new Error('QUOTA_EXCEEDED')
        }
        if (apiKey === 'AIzaSyTIMEOUT_KEY123456789012') {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 100)
          })
        }
        if (apiKey === 'AIzaSySAFETY_KEY123456789012') {
          throw new Error('SAFETY violation')
        }
        if (apiKey === 'AIzaSyEMPTY_RESPONSE_KEY123456') {
          return {
            response: {
              text: () => ''
            }
          }
        }
        if (apiKey === 'AIzaSyNO_RESPONSE_KEY123456789') {
          return { response: null }
        }

        // Default successful response
        return {
          response: {
            text: () => `Enhanced: ${prompt}`
          }
        }
      })
    })
  }))
}))

// Helper function to create a mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest
}

describe('/api/gemini', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log and console.error to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Input Validation', () => {
    it('should return 400 when API key is missing', async () => {
      const request = createMockRequest({
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('API key is required')
    })

    it('should return 400 when prompt is missing', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Prompt is required')
    })

    it('should return 400 when prompt is empty', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: '   '
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Prompt is required')
    })

    it('should return 400 when API key format is invalid', async () => {
      const request = createMockRequest({
        apiKey: 'invalid-key',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key format')
    })

    it('should return 400 when training data is incomplete', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Test email',
        trainingData: {
          input: 'Test input',
          output: ''
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Training data must include both input and output')
    })
  })

  describe('Template Enhancement', () => {
    it('should successfully enhance email with professional template', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Hey, can you send me the report?',
        template: EmailTemplate.PROFESSIONAL
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Enhanced:')
    })

    it('should successfully enhance email with friend template', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Need that document ASAP',
        template: EmailTemplate.FRIEND
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Enhanced:')
    })

    it('should handle all template types', async () => {
      const templates = [
        EmailTemplate.PROFESSIONAL,
        EmailTemplate.FRIEND,
        EmailTemplate.POLITE,
        EmailTemplate.DIRECT,
        EmailTemplate.FOLLOWUP,
        EmailTemplate.REMINDER
      ]

      for (const template of templates) {
        const request = createMockRequest({
          apiKey: 'AIzaSyTest123456789012345',
          prompt: 'Test email content',
          template
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      }
    })
  })

  describe('Training-based Generation', () => {
    it('should successfully generate email with training data', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'New test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Enhanced:')
    })

    it('should validate training data completeness', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Test input',
        trainingData: {
          input: '',
          output: 'Training output'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Training data must include both input and output')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid API key error', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyINVALID_KEY123456789',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid API key')
    })

    it('should handle permission denied error', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyPERMISSION_DENIED_KEY123',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Permission denied')
    })

    it('should handle quota exceeded error', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyQUOTA_EXCEEDED_KEY123456',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('quota exceeded')
    })

    it('should handle safety policy violations', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSySAFETY_KEY123456789012',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('safety policies')
    })

    it('should handle empty response from API', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyEMPTY_RESPONSE_KEY123456',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to process request')
    })

    it('should handle no response from API', async () => {
      const request = createMockRequest({
        apiKey: 'AIzaSyNO_RESPONSE_KEY123456789',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to process request')
    })
  })

  describe('Response Processing', () => {
    it('should clean response text properly', async () => {
      // Mock a response with prefixes that should be cleaned
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Enhanced email: This is the cleaned response'
        }
      })

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Test email'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBe('This is the cleaned response')
    })
  })

  describe('Logging', () => {
    it('should log successful requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log')

      const request = createMockRequest({
        apiKey: 'AIzaSyTest123456789012345',
        prompt: 'Test email',
        template: EmailTemplate.PROFESSIONAL
      })

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Gemini API Request:',
        expect.objectContaining({
          template: EmailTemplate.PROFESSIONAL,
          success: true,
          error: null
        })
      )
    })

    it('should log failed requests', async () => {
      const consoleSpy = jest.spyOn(console, 'log')

      const request = createMockRequest({
        apiKey: 'AIzaSyINVALID_KEY123456789',
        prompt: 'Test email'
      })

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Gemini API Request:',
        expect.objectContaining({
          success: false,
          error: 'Invalid API key'
        })
      )
    })
  })
})