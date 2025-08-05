import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { EmailTemplate, GeminiRequest, GeminiResponse } from '@/types'
import { 
  sanitizeEmailContent, 
  validateApiKeyFormat as secureValidateApiKey,
  applySecurityHeaders 
} from '@/lib/security'

// Template prompts for email enhancement
const TEMPLATE_PROMPTS = {
  [EmailTemplate.PROFESSIONAL]: "Rewrite this email in a professional, formal tone suitable for office communication. Maintain the core message while improving clarity, structure, and professionalism:",
  [EmailTemplate.FRIEND]: "Rewrite this email in a friendly, casual tone suitable for personal communication. Keep it warm and approachable while maintaining the main points:",
  [EmailTemplate.POLITE]: "Rewrite this email with extra politeness and courtesy. Add appropriate pleasantries and respectful language while preserving the original intent:",
  [EmailTemplate.DIRECT]: "Rewrite this email to be more direct and concise while maintaining professionalism. Remove unnecessary words and get straight to the point:",
  [EmailTemplate.FOLLOWUP]: "Rewrite this email as a polite follow-up message. Add appropriate context about previous communication and maintain a professional tone:",
  [EmailTemplate.REMINDER]: "Rewrite this email as a gentle reminder. Use courteous language that prompts action without being pushy or demanding:"
}

// Utility function to validate API key format (legacy - using secure version)
function validateApiKeyFormat(apiKey: string): boolean {
  const result = secureValidateApiKey(apiKey)
  return result.isValid
}

// Enhanced training data validation with pattern analysis
function validateTrainingData(
  trainingData: { input: string; output: string }, 
  testInput: string
): { isValid: boolean; error?: string } {
  const { input, output } = trainingData

  // Basic presence validation
  if (!input || !output) {
    return { isValid: false, error: 'Training data must include both input and output' }
  }

  // Length validation
  if (input.trim().length === 0 || output.trim().length === 0) {
    return { isValid: false, error: 'Training input and output cannot be empty' }
  }

  // Minimum content length for meaningful training
  if (input.trim().length < 10) {
    return { isValid: false, error: 'Training input should be at least 10 characters long for meaningful pattern learning' }
  }

  if (output.trim().length < 10) {
    return { isValid: false, error: 'Training output should be at least 10 characters long for meaningful pattern learning' }
  }

  // Maximum content length to prevent token limit issues
  if (input.length > 2000) {
    return { isValid: false, error: 'Training input is too long (maximum 2000 characters)' }
  }

  if (output.length > 2000) {
    return { isValid: false, error: 'Training output is too long (maximum 2000 characters)' }
  }

  // Test input validation
  if (!testInput || testInput.trim().length === 0) {
    return { isValid: false, error: 'Test input is required for training-based generation' }
  }

  if (testInput.trim().length < 5) {
    return { isValid: false, error: 'Test input should be at least 5 characters long' }
  }

  if (testInput.length > 2000) {
    return { isValid: false, error: 'Test input is too long (maximum 2000 characters)' }
  }

  // Pattern analysis - check if training data shows meaningful transformation
  const inputWords = input.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  const outputWords = output.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  
  // Check if output is just a copy of input (insufficient training)
  if (input.trim().toLowerCase() === output.trim().toLowerCase()) {
    return { 
      isValid: false, 
      error: 'Training input and output are identical. Please provide an example that shows a clear transformation pattern.' 
    }
  }

  // Check for minimal transformation (too similar)
  const commonWords = inputWords.filter(word => outputWords.includes(word))
  const similarityRatio = commonWords.length / Math.max(inputWords.length, outputWords.length)
  
  if (similarityRatio > 0.9 && Math.abs(input.length - output.length) < 10) {
    return { 
      isValid: false, 
      error: 'Training input and output are too similar. Please provide an example with a more distinct transformation pattern.' 
    }
  }

  // Check for reasonable length relationship (allow up to 5x expansion)
  if (output.length > input.length * 5) {
    return { 
      isValid: false, 
      error: 'Training output is significantly longer than input. Please ensure the transformation is reasonable and focused.' 
    }
  }

  // Email-specific validation
  const emailPatterns = {
    hasGreeting: /^(hi|hello|dear|hey|good\s+(morning|afternoon|evening))/i,
    hasClosing: /(regards|sincerely|thanks|best|cheers|yours)/i,
    hasSubject: /subject:|re:/i
  }

  // Provide guidance for better training examples
  const inputHasGreeting = emailPatterns.hasGreeting.test(input)
  const outputHasGreeting = emailPatterns.hasGreeting.test(output)
  const inputHasClosing = emailPatterns.hasClosing.test(input)
  const outputHasClosing = emailPatterns.hasClosing.test(output)

  // If the transformation adds/removes email structure, ensure it's consistent
  if (!inputHasGreeting && outputHasGreeting && !inputHasClosing && !outputHasClosing) {
    // This might indicate the pattern is to add greetings - this is valid
  } else if (inputHasGreeting && !outputHasGreeting && inputHasClosing && !outputHasClosing) {
    // This might indicate the pattern is to make emails more direct - this is valid
  }

  return { isValid: true }
}

// Enhanced prompt engineering for training-based email generation
function constructTrainingPrompt(request: GeminiRequest): string {
  const { prompt, trainingData } = request
  
  if (!trainingData) {
    throw new Error('Training data is required for training-based generation')
  }

  return `You are an AI email assistant that learns communication patterns from examples. 

TRAINING EXAMPLE:
Input Email: "${trainingData.input}"
Desired Output: "${trainingData.output}"

ANALYSIS INSTRUCTIONS:
1. Analyze the transformation pattern between the input and output
2. Identify the communication style, tone, structure, and formatting changes
3. Note any specific phrases, greetings, closings, or language patterns
4. Understand the level of formality, politeness, and directness
5. Observe any content additions, removals, or reorganization

TASK:
Apply the same transformation pattern to this new email:
Input Email: "${prompt}"

REQUIREMENTS:
- Maintain the core message and intent of the new input
- Apply the same style, tone, and structural changes observed in the training example
- Use similar language patterns and formatting
- Ensure the output follows the same communication approach as the training output
- Do not add information not present in the input unless the training example shows this pattern

Generated Output:`
}

// Utility function to construct prompts
function constructPrompt(request: GeminiRequest): string {
  const { prompt, template, trainingData } = request

  // Training-based prompt with enhanced pattern analysis
  if (trainingData) {
    return constructTrainingPrompt(request)
  }

  // Template-based prompt
  if (template && template in TEMPLATE_PROMPTS) {
    return `${TEMPLATE_PROMPTS[template as keyof typeof TEMPLATE_PROMPTS]}

Original email:
${prompt}

Enhanced email:`
  }

  // Default prompt
  return prompt
}

// Enhanced response parsing for training-based generation
function parseResponse(response: string, isTrainingBased: boolean = false): string {
  // Remove common AI response prefixes/suffixes
  let cleaned = response.trim()
  
  // Training-specific prefixes
  if (isTrainingBased) {
    cleaned = cleaned.replace(/^(Generated Output:|Generated Email:|Output Email:|Transformed Email:)\s*/i, '')
    cleaned = cleaned.replace(/^(Based on the training pattern:|Following the learned pattern:)\s*/i, '')
  }
  
  // General prefixes
  cleaned = cleaned.replace(/^(Enhanced email:|Output:|Result:|Email:)\s*/i, '')
  
  // Remove markdown formatting if present
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '')
  })
  
  // Remove analysis or explanation sections that might be included
  cleaned = cleaned.replace(/\n\n(Analysis:|Explanation:|Note:)[\s\S]*$/i, '')
  
  // Clean up extra whitespace and line breaks
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  return cleaned.trim()
}

// Logging utility
function logRequest(request: GeminiRequest, success: boolean, error?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    template: request.template || 'none',
    hasTrainingData: !!request.trainingData,
    promptLength: request.prompt.length,
    success,
    error: error || null
  }
  
  console.log('Gemini API Request:', logData)
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequest = await request.json()
    const { prompt, template, trainingData } = body
    
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    // Validate required fields
    if (!apiKey) {
      const response = NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    if (!prompt || prompt.trim().length === 0) {
      const response = NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Sanitize input content
    let sanitizedPrompt: string
    let sanitizedTrainingData: typeof trainingData
    
    try {
      sanitizedPrompt = sanitizeEmailContent(prompt)
      
      if (trainingData) {
        sanitizedTrainingData = {
          input: sanitizeEmailContent(trainingData.input),
          output: sanitizeEmailContent(trainingData.output)
        }
      }
    } catch (sanitizationError) {
      const response = NextResponse.json(
        { success: false, error: sanitizationError instanceof Error ? sanitizationError.message : 'Invalid input content' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Validate API key format with enhanced security
    const apiKeyValidation = secureValidateApiKey(apiKey)
    if (!apiKeyValidation.isValid) {
      logRequest(body, false, apiKeyValidation.error || 'Invalid API key format')
      const response = NextResponse.json(
        { success: false, error: apiKeyValidation.error || 'Invalid API key format' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Enhanced training data validation and pattern analysis
    if (sanitizedTrainingData) {
      const validationResult = validateTrainingData(sanitizedTrainingData, sanitizedPrompt)
      if (!validationResult.isValid) {
        const response = NextResponse.json(
          { success: false, error: validationResult.error },
          { status: 400 }
        )
        return applySecurityHeaders(response)
      }
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Construct the prompt with sanitized data
    const sanitizedBody = {
      ...body,
      prompt: sanitizedPrompt,
      trainingData: sanitizedTrainingData
    }
    const fullPrompt = constructPrompt(sanitizedBody)

    // Make API request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const result = await model.generateContent(fullPrompt)
      clearTimeout(timeoutId)

      if (!result.response) {
        throw new Error('No response from Gemini API')
      }

      const responseText = result.response.text()
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from Gemini API')
      }

      // Parse and clean the response
      const cleanedResponse = parseResponse(responseText, !!body.trainingData)

      // Log successful request
      logRequest(body, true)

      const response = NextResponse.json({
        success: true,
        data: cleanedResponse
      })
      
      return applySecurityHeaders(response)

    } catch (apiError) {
      clearTimeout(timeoutId)
      throw apiError
    }

  } catch (error) {
    console.error('Gemini API error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      // API key related errors
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key')) {
        logRequest(await request.json().catch(() => ({})), false, 'Invalid API key')
        const response = NextResponse.json(
          { success: false, error: 'Invalid API key. Please check your Google Gemini API key.' },
          { status: 401 }
        )
        return applySecurityHeaders(response)
      }

      // Permission errors
      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission denied')) {
        logRequest(await request.json().catch(() => ({})), false, 'Permission denied')
        const response = NextResponse.json(
          { success: false, error: 'Permission denied. Please ensure your API key has the necessary permissions.' },
          { status: 403 }
        )
        return applySecurityHeaders(response)
      }

      // Rate limiting errors
      if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota exceeded') || error.message.includes('rate limit')) {
        logRequest(await request.json().catch(() => ({})), false, 'Rate limit exceeded')
        const response = NextResponse.json(
          { success: false, error: 'API quota exceeded. Please check your usage limits or try again later.' },
          { status: 429 }
        )
        return applySecurityHeaders(response)
      }

      // Timeout errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        logRequest(await request.json().catch(() => ({})), false, 'Request timeout')
        const response = NextResponse.json(
          { success: false, error: 'Request timed out. Please try again with a shorter prompt.' },
          { status: 408 }
        )
        return applySecurityHeaders(response)
      }

      // Content policy violations
      if (error.message.includes('SAFETY') || error.message.includes('content policy')) {
        logRequest(await request.json().catch(() => ({})), false, 'Content policy violation')
        const response = NextResponse.json(
          { success: false, error: 'Content violates safety policies. Please modify your email and try again.' },
          { status: 400 }
        )
        return applySecurityHeaders(response)
      }

      // Training-specific errors
      if (error.message.includes('training') || error.message.includes('pattern')) {
        logRequest(await request.json().catch(() => ({})), false, 'Training pattern error')
        const response = NextResponse.json(
          { success: false, error: 'Unable to learn from the provided training example. Please ensure your training data shows a clear transformation pattern.' },
          { status: 400 }
        )
        return applySecurityHeaders(response)
      }

      // Context length errors (common with training data)
      if (error.message.includes('context_length') || error.message.includes('token limit')) {
        logRequest(await request.json().catch(() => ({})), false, 'Context length exceeded')
        const response = NextResponse.json(
          { success: false, error: 'Training data and input are too long. Please shorten your content and try again.' },
          { status: 400 }
        )
        return applySecurityHeaders(response)
      }
    }

    // Generic error handling
    logRequest(await request.json().catch(() => ({})), false, error instanceof Error ? error.message : 'Unknown error')
    const response = NextResponse.json(
      { success: false, error: 'Failed to process request. Please try again.' },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}