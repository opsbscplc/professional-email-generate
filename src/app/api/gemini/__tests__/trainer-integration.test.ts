/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation((apiKey: string) => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation((prompt: string) => {
        // Simulate different responses based on API key and prompt content
        if (apiKey.includes('INVALID_KEY')) {
          throw new Error('API_KEY_INVALID')
        }
        
        // Simulate training-based responses
        if (prompt.includes('TRAINING EXAMPLE:')) {
          const inputMatch = prompt.match(/Input Email: "([^"]+)"/);
          const outputMatch = prompt.match(/Desired Output: "([^"]+)"/);
          const newInputMatch = prompt.match(/Input Email: "([^"]+)"(?!.*Desired Output)/);
          
          if (inputMatch && outputMatch && newInputMatch) {
            const trainingInput = inputMatch[1];
            const trainingOutput = outputMatch[1];
            const newInput = newInputMatch[1];
            
            // Simulate pattern learning
            if (trainingInput.includes('hey') && trainingOutput.includes('Hello')) {
              return {
                response: {
                  text: () => newInput.replace(/hey/gi, 'Hello').replace(/u/g, 'you')
                }
              }
            }
            
            if (trainingInput.length < trainingOutput.length) {
              return {
                response: {
                  text: () => `Dear colleague,\n\n${newInput}\n\nBest regards`
                }
              }
            }
            
            return {
              response: {
                text: () => `Generated Output: Transformed version of "${newInput}" based on training pattern`
              }
            }
          }
        }

        // Default response
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
function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockImplementation((key: string) => headers[key.toLowerCase()] || null)
    }
  } as unknown as NextRequest
}

describe('Trainer AI Processing Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Don't mock console for debugging
    // jest.spyOn(console, 'log').mockImplementation(() => {})
    // jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Training Data Validation', () => {
    it('should validate complete training data', async () => {
      const request = createMockRequest({
        prompt: 'hey can u help me with this task',
        trainingData: {
          input: 'hey can u send me the report',
          output: 'Hello, could you please send me the report? Thank you.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Hello')
    })

    it('should reject training data with missing input', async () => {
      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: '',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Training data must include both input and output')
    })

    it('should reject training data with missing output', async () => {
      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: ''
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Training data must include both input and output')
    })

    it('should reject training data that is too short', async () => {
      const request = createMockRequest({
        prompt: 'test input for processing',
        trainingData: {
          input: 'hi',
          output: 'hello'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('at least 10 characters long')
    })

    it('should reject identical training input and output', async () => {
      const request = createMockRequest({
        prompt: 'test input for processing',
        trainingData: {
          input: 'Please send me the report when you have time',
          output: 'Please send me the report when you have time'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('identical')
    })

    it('should reject training data that is too similar', async () => {
      const request = createMockRequest({
        prompt: 'test input for processing',
        trainingData: {
          input: 'Please send me the report when you have time',
          output: 'Please send me the report when you have time'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('identical')
    })

    it('should reject training data that is too long', async () => {
      const longText = 'a'.repeat(2001)
      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: longText,
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('too long')
    })

    it('should reject test input that is too short', async () => {
      const request = createMockRequest({
        prompt: 'hi',
        trainingData: {
          input: 'Training input example that is long enough',
          output: 'Training output example that is also long enough'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('at least 5 characters long')
    })
  })

  describe('Pattern Learning and Application', () => {
    it('should learn casual to formal transformation pattern', async () => {
      const request = createMockRequest({
        prompt: 'hey can u help me with this task',
        trainingData: {
          input: 'hey can u send me the report',
          output: 'Hello, could you please send me the report? Thank you.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Hello')
      expect(data.data).toContain('you')
      expect(data.data).not.toContain('hey')
      expect(data.data).not.toContain(' u ')
    })

    it('should learn content expansion pattern', async () => {
      const request = createMockRequest({
        prompt: 'need help with something important',
        trainingData: {
          input: 'need report for meeting',
          output: 'Dear colleague, I need the quarterly report for our upcoming meeting. Best regards'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      if (response.status !== 200) {
        console.log('Validation error:', data.error)
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toContain('Dear colleague')
      expect(data.data).toContain('Best regards')
    })

    it('should apply learned pattern to different content', async () => {
      const request = createMockRequest({
        prompt: 'can u review my document please',
        trainingData: {
          input: 'can u send me the files',
          output: 'Could you please send me the files? I would appreciate it.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.length).toBeGreaterThan(0)
    })
  })

  describe('Enhanced Prompt Engineering', () => {
    it('should use enhanced training prompt structure', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Generated response with pattern analysis'
        }
      })

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      await POST(request)

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('You are an AI email assistant that learns communication patterns')
      )
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('ANALYSIS INSTRUCTIONS:')
      )
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Apply the same transformation pattern')
      )
    })

    it('should include pattern analysis instructions in prompt', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Generated response'
        }
      })

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      await POST(request)

      const calledPrompt = mockGenerateContent.mock.calls[0][0]
      expect(calledPrompt).toContain('Analyze the transformation pattern')
      expect(calledPrompt).toContain('communication style, tone, structure')
      expect(calledPrompt).toContain('level of formality, politeness')
      expect(calledPrompt).toContain('Maintain the core message and intent')
    })
  })

  describe('Response Processing', () => {
    it('should clean training-specific response prefixes', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Generated Output: This is the actual email content'
        }
      })

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBe('This is the actual email content')
      expect(data.data).not.toContain('Generated Output:')
    })

    it('should remove analysis sections from response', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'This is the email content\n\nAnalysis: The transformation applied formal tone'
        }
      })

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBe('This is the email content')
      expect(data.data).not.toContain('Analysis:')
    })
  })

  describe('Error Handling', () => {
    it('should handle training pattern errors', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(
        new Error('Unable to identify clear training pattern')
      )

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('clear transformation pattern')
    })

    it('should handle context length errors with training data', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(
        new Error('context_length exceeded')
      )

      const { GoogleGenerativeAI } = require('@google/generative-ai')
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: () => ({
          generateContent: mockGenerateContent
        })
      }))

      const request = createMockRequest({
        prompt: 'test input',
        trainingData: {
          input: 'Training input example',
          output: 'Training output example'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('too long')
    })
  })

  describe('Complete Training Workflow', () => {
    it('should handle complete training workflow from validation to response', async () => {
      const request = createMockRequest({
        prompt: 'hey need ur help with project task',
        trainingData: {
          input: 'hey can u review my code please',
          output: 'Hello, could you please review my code when you have a moment? Thank you for your time.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(typeof data.data).toBe('string')
      expect(data.data.length).toBeGreaterThan(0)
    })

    it('should log training requests properly', async () => {
      const consoleSpy = jest.spyOn(console, 'log')

      const request = createMockRequest({
        prompt: 'test input for training processing',
        trainingData: {
          input: 'Training input example that is long enough',
          output: 'Training output example that is also long enough'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      await POST(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Gemini API Request:',
        expect.objectContaining({
          hasTrainingData: true
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle training data with special characters', async () => {
      const request = createMockRequest({
        prompt: 'test@email.com needs help with something',
        trainingData: {
          input: 'user@domain.com sent message about project',
          output: 'The user at user@domain.com has sent a message that requires attention.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle training data with line breaks', async () => {
      const request = createMockRequest({
        prompt: 'need help\nwith task today',
        trainingData: {
          input: 'quick question\nabout project status',
          output: 'I have a quick question about the project.\n\nCould you please help me when you have time?'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle training data with mixed languages', async () => {
      const request = createMockRequest({
        prompt: 'hello, need help with task today',
        trainingData: {
          input: 'hola, necesito ayuda con proyecto',
          output: 'Hello, I need assistance with this matter. Thank you.'
        }
      }, { authorization: 'Bearer AIzaSyTest123456789012345' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})