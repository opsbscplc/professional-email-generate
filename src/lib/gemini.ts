import { EmailTemplate, GeminiResponse } from '@/types/gemini'
import { parseGeminiApiError, AppError, parseApiError } from './error-handling'
import { requestDeduplicator } from './request-deduplication'
import { apiCache, withCache } from './cache'

// Client-side utility functions for Gemini API integration

export interface GeminiRequestOptions {
  apiKey: string
  prompt: string
  template?: EmailTemplate
  trainingData?: {
    input: string
    output: string
  }
}

// Validate API key format on client side
export function validateApiKeyFormat(apiKey: string): boolean {
  return typeof apiKey === 'string' && 
         apiKey.length >= 20 && 
         apiKey.startsWith('AI')
}

// Test API key validity (cached for 5 minutes)
export const testApiKey = withCache(
  async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    if (!validateApiKeyFormat(apiKey)) {
      throw new AppError('Invalid API key format', 'Please check your API key format', 'INVALID_API_KEY')
    }

    const response = await requestDeduplicator.deduplicate(
      '/api/gemini/test',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({}),
      },
      async () => {
        const res = await fetch('/api/gemini/test', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({}),
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw parseGeminiApiError(res, errorData)
        }
        
        return res.json()
      }
    )

    if (response.success) {
      return { valid: true }
    }

    return { valid: false, error: response.error || 'API key validation failed' }
  } catch (error) {
    const appError = parseApiError(error)
    console.error('API key test error:', appError)
    return { valid: false, error: appError.userMessage }
  }
}, 'testApiKey', 5 * 60 * 1000) // Cache for 5 minutes

// Enhance email with template
export async function enhanceEmailWithTemplate(
  apiKey: string,
  draftEmail: string,
  template: EmailTemplate
): Promise<GeminiResponse> {
  try {
    if (!validateApiKeyFormat(apiKey)) {
      throw new AppError('Invalid API key format', 'Please check your API key format', 'INVALID_API_KEY')
    }

    if (!draftEmail.trim()) {
      throw new AppError('Email content is required', 'Please enter some email content', 'INVALID_INPUT')
    }

    const requestBody = {
      prompt: draftEmail,
      template,
    }

    const result = await requestDeduplicator.deduplicate(
      '/api/gemini',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      },
      async () => {
        console.log('🚀 API Request:', {
          endpoint: '/api/gemini',
          method: 'POST',
          template,
          draftLength: draftEmail.length,
          hasApiKey: !!apiKey,
          apiKeyFormat: apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3),
          timestamp: new Date().toISOString()
        })

        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody),
        })

        console.log('📡 API Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ API Error Response:', errorData)
          throw parseGeminiApiError(response, errorData)
        }

        const result = await response.json()
        console.log('✅ API Success:', {
          success: result.success,
          hasData: !!result.data,
          dataLength: result.data?.length || 0
        })

        return result
      }
    )

    return result
  } catch (error) {
    const appError = parseApiError(error)
    console.error('❌ Template Enhancement Error:', {
      error: appError,
      code: appError.code,
      status: appError.status,
      message: appError.message,
      userMessage: appError.userMessage
    })
    return {
      success: false,
      error: appError.userMessage
    }
  }
}

// Enhanced training data validation on client side
export function validateTrainingDataClient(
  trainingData: { input: string; output: string },
  testInput: string
): { isValid: boolean; error?: string; suggestions?: string[] } {
  const { input, output } = trainingData
  const suggestions: string[] = []

  // Basic validation
  if (!input?.trim() || !output?.trim()) {
    return { isValid: false, error: 'Both training input and output are required' }
  }

  if (!testInput?.trim()) {
    return { isValid: false, error: 'Test input is required' }
  }

  // Length validation
  if (input.trim().length < 10) {
    return { isValid: false, error: 'Training input should be at least 10 characters long' }
  }

  if (output.trim().length < 10) {
    return { isValid: false, error: 'Training output should be at least 10 characters long' }
  }

  if (testInput.trim().length < 5) {
    return { isValid: false, error: 'Test input should be at least 5 characters long' }
  }

  // Similarity check
  if (input.trim().toLowerCase() === output.trim().toLowerCase()) {
    return { 
      isValid: false, 
      error: 'Training input and output are identical. Please show a clear transformation.',
      suggestions: [
        'Make the output more professional than the input',
        'Change the tone (formal to casual or vice versa)',
        'Add or remove greetings and closings',
        'Restructure the content organization'
      ]
    }
  }

  // Provide helpful suggestions
  const inputLower = input.toLowerCase()
  const outputLower = output.toLowerCase()

  if (inputLower.includes('hey') && !outputLower.includes('hey')) {
    suggestions.push('Good: Your example shows how to make greetings more formal')
  }

  if (!inputLower.includes('please') && outputLower.includes('please')) {
    suggestions.push('Good: Your example shows how to add politeness')
  }

  if (input.length < output.length * 0.7) {
    suggestions.push('Your training shows how to expand and elaborate on content')
  } else if (input.length > output.length * 1.3) {
    suggestions.push('Your training shows how to make content more concise')
  }

  return { isValid: true, suggestions }
}

// Generate email with training data
export async function generateEmailWithTraining(
  apiKey: string,
  testInput: string,
  trainingData: { input: string; output: string }
): Promise<GeminiResponse> {
  try {
    if (!validateApiKeyFormat(apiKey)) {
      throw new AppError('Invalid API key format', 'Please check your API key format', 'INVALID_API_KEY')
    }

    // Client-side validation
    const validation = validateTrainingDataClient(trainingData, testInput)
    if (!validation.isValid) {
      throw new AppError(validation.error || 'Invalid training data', validation.error, 'INVALID_INPUT')
    }

    const requestBody = {
      prompt: testInput,
      trainingData,
    }

    const result = await requestDeduplicator.deduplicate(
      '/api/gemini',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
      },
      async () => {
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw parseGeminiApiError(response, errorData)
        }

        return response.json()
      }
    )

    return result
  } catch (error) {
    const appError = parseApiError(error)
    console.error('Training generation error:', appError)
    return { 
      success: false, 
      error: appError.userMessage 
    }
  }
}

// Utility to get user-friendly error messages
export function getErrorMessage(error: string): string {
  const errorMappings: Record<string, string> = {
    'Invalid API key': 'Please check your Google Gemini API key and try again.',
    'Permission denied': 'Your API key doesn\'t have the necessary permissions. Please check your Google Cloud Console settings.',
    'API quota exceeded': 'You\'ve reached your API usage limit. Please check your quota in Google Cloud Console.',
    'Request timed out': 'The request took too long to process. Please try again with a shorter email.',
    'Content violates safety policies': 'Your email content violates safety policies. Please modify your content and try again.',
    'Network error': 'Unable to connect to the service. Please check your internet connection and try again.',
  }

  // Check for partial matches
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }

  return error || 'An unexpected error occurred. Please try again.'
}

// Rate limiting utility for client-side requests
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number

  constructor(maxRequests: number = 10, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    // Check if we can make a new request
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }

  getTimeUntilNextRequest(): number {
    if (this.requests.length === 0) return 0
    
    const oldestRequest = Math.min(...this.requests)
    const timeUntilReset = this.timeWindow - (Date.now() - oldestRequest)
    
    return Math.max(0, timeUntilReset)
  }
}

// Export a default rate limiter instance
export const geminiRateLimiter = new RateLimiter(10, 60000) // 10 requests per minute

// Wrapper function that includes rate limiting
export async function makeRateLimitedRequest<T>(
  requestFn: () => Promise<T>
): Promise<T | { success: false; error: string }> {
  if (!geminiRateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(geminiRateLimiter.getTimeUntilNextRequest() / 1000)
    return {
      success: false,
      error: `Rate limit exceeded. Please wait ${waitTime} seconds before making another request.`
    } as { success: false; error: string }
  }

  return await requestFn()
}