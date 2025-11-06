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
  let body: GeminiRequest | null = null

  try {
    body = await request.json() as GeminiRequest
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

    // Initialize Gemini AI with error handling
    let genAI: GoogleGenerativeAI
    let model: any

    try {
      genAI = new GoogleGenerativeAI(apiKey)
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    } catch (initError) {
      console.error('Failed to initialize Google Generative AI:', initError)
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to initialize AI service. Please verify your API key and try again.',
          details: process.env.NODE_ENV === 'development' && initError instanceof Error ? initError.message : undefined
        },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    }

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

      // CRITICAL: Log the raw result for debugging
      console.error('=== GEMINI RAW RESULT ===')
      console.error('Result type:', typeof result)
      console.error('Has response:', !!result?.response)

      if (!result || !result.response) {
        console.error('CRITICAL: No result or response object returned')
        console.error('Full result:', JSON.stringify(result, null, 2))
        throw new Error('No response from Gemini API')
      }

      const response = result.response

      // CRITICAL: Log full response structure before validation
      console.error('Response object keys:', Object.keys(response))
      console.error('Prompt feedback:', JSON.stringify(response.promptFeedback, null, 2))
      console.error('Candidates count:', response.candidates?.length || 0)

      // Check for prompt-level blocking FIRST
      if (response.promptFeedback?.blockReason) {
        console.error('PROMPT BLOCKED:', response.promptFeedback.blockReason)
        throw new Error(`Prompt was blocked: ${response.promptFeedback.blockReason}. Please modify your input.`)
      }

      // Check if response has candidates
      if (!response.candidates || response.candidates.length === 0) {
        console.error('CRITICAL: No candidates in response')
        console.error('Full response:', JSON.stringify({
          promptFeedback: response.promptFeedback,
          candidates: response.candidates,
          usageMetadata: (response as any).usageMetadata
        }, null, 2))
        throw new Error('Response was blocked. The AI could not generate content for this request.')
      }

      // Log candidate details
      const candidate = response.candidates[0]
      console.error('First candidate:', JSON.stringify({
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings,
        hasContent: !!candidate.content,
        partsCount: candidate.content?.parts?.length || 0
      }, null, 2))

      // Check finish reason and safety ratings
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.error('Content generation stopped - finishReason:', candidate.finishReason)
        console.error('Safety ratings:', JSON.stringify(candidate.safetyRatings, null, 2))

        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Content violates safety policies. Please modify your email and try again.')
        } else if (candidate.finishReason === 'RECITATION') {
          throw new Error('Response blocked due to recitation. Please rephrase your request.')
        } else if (candidate.finishReason === 'MAX_TOKENS') {
          throw new Error('Response too long. Please try with shorter content.')
        } else {
          throw new Error(`Content generation stopped: ${candidate.finishReason}`)
        }
      }

      // Check content parts structure before calling text()
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('CRITICAL: No content parts in candidate')
        console.error('Candidate structure:', JSON.stringify(candidate, null, 2))
        throw new Error('No content generated. The response structure is invalid.')
      }

      // Now safely call text() - it's synchronous, not async
      let responseText: string
      try {
        // CRITICAL: The text() method can throw - catch and log the ACTUAL error
        responseText = response.text()
        console.error('Successfully extracted text, length:', responseText?.length || 0)
      } catch (textError) {
        // Log the ACTUAL error that text() threw
        console.error('=== CRITICAL: response.text() threw an error ===')
        console.error('Error type:', textError?.constructor?.name)
        console.error('Error message:', textError instanceof Error ? textError.message : String(textError))
        console.error('Error stack:', textError instanceof Error ? textError.stack : 'N/A')
        console.error('Full error object:', JSON.stringify(textError, Object.getOwnPropertyNames(textError), 2))

        // Try alternative access method
        try {
          const altText = candidate.content.parts[0].text
          console.error('Alternative text extraction succeeded, length:', altText?.length || 0)
          responseText = altText
        } catch (altError) {
          console.error('Alternative extraction also failed:', altError)
          console.error('Full response structure:', JSON.stringify(response, null, 2))
          throw new Error(`Failed to extract text: ${textError instanceof Error ? textError.message : 'Unknown error'}`)
        }
      }

      if (!responseText || responseText.trim().length === 0) {
        console.error('CRITICAL: responseText is empty after extraction')
        throw new Error('Empty response from Gemini API')
      }

      // Parse and clean the response
      const cleanedResponse = parseResponse(responseText, !!body.trainingData)

      // Log successful request
      logRequest(body, true)

      const apiResponse = NextResponse.json({
        success: true,
        data: cleanedResponse
      })

      return applySecurityHeaders(apiResponse)

    } catch (apiError) {
      clearTimeout(timeoutId)
      throw apiError
    }

  } catch (error) {
    // CRITICAL: Ensure we ALWAYS return valid JSON, even if error handling fails
    try {
      // Enhanced error logging with stack trace - using JSON.stringify for Vercel logs
      console.error('=== GEMINI API ERROR START ===')
      console.error('Error object:', JSON.stringify({
        type: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? (error as any).cause : undefined
      }, null, 2))
      console.error('=== GEMINI API ERROR END ===')

      // Log the full error details for debugging
      if (error instanceof Error) {
        console.error('Detailed Error Info:', JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: (error as any).cause
        }, null, 2))
      }

      // Handle specific error types
      if (error instanceof Error) {
        // Module import/dependency errors
        if (error.message.includes('Cannot find module') ||
            error.message.includes('@google/generative-ai') ||
            error.message.includes('MODULE_NOT_FOUND')) {
          console.error('CRITICAL: Missing dependency detected')
          const response = NextResponse.json(
            {
              success: false,
              error: 'Server configuration error. Missing required dependency. Please contact support.',
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
          )
          return applySecurityHeaders(response)
        }

        // API key related errors
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid API key')) {
          if (body) logRequest(body, false, 'Invalid API key')
          const response = NextResponse.json(
            { success: false, error: 'Invalid API key. Please check your Google Gemini API key.' },
            { status: 401 }
          )
          return applySecurityHeaders(response)
        }

        // Permission errors
        if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission denied')) {
          if (body) logRequest(body, false, 'Permission denied')
          const response = NextResponse.json(
            { success: false, error: 'Permission denied. Please ensure your API key has the necessary permissions.' },
            { status: 403 }
          )
          return applySecurityHeaders(response)
        }

        // Rate limiting errors
        if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota exceeded') || error.message.includes('rate limit')) {
          if (body) logRequest(body, false, 'Rate limit exceeded')
          const response = NextResponse.json(
            { success: false, error: 'API quota exceeded. Please check your usage limits or try again later.' },
            { status: 429 }
          )
          return applySecurityHeaders(response)
        }

        // Timeout errors
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          if (body) logRequest(body, false, 'Request timeout')
          const response = NextResponse.json(
            { success: false, error: 'Request timed out. Please try again with a shorter prompt.' },
            { status: 408 }
          )
          return applySecurityHeaders(response)
        }

        // Content policy violations
        if (error.message.includes('SAFETY') || error.message.includes('content policy')) {
          if (body) logRequest(body, false, 'Content policy violation')
          const response = NextResponse.json(
            { success: false, error: 'Content violates safety policies. Please modify your email and try again.' },
            { status: 400 }
          )
          return applySecurityHeaders(response)
        }

        // Training-specific errors
        if (error.message.includes('training') || error.message.includes('pattern')) {
          if (body) logRequest(body, false, 'Training pattern error')
          const response = NextResponse.json(
            { success: false, error: 'Unable to learn from the provided training example. Please ensure your training data shows a clear transformation pattern.' },
            { status: 400 }
          )
          return applySecurityHeaders(response)
        }

        // Context length errors (common with training data)
        if (error.message.includes('context_length') || error.message.includes('token limit')) {
          if (body) logRequest(body, false, 'Context length exceeded')
          const response = NextResponse.json(
            { success: false, error: 'Training data and input are too long. Please shorten your content and try again.' },
            { status: 400 }
          )
          return applySecurityHeaders(response)
        }
      }

      // Generic error handling with more details
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (body) logRequest(body, false, errorMessage)

      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to process request. Please try again.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      )
      return applySecurityHeaders(response)
    } catch (innerError) {
      // LAST RESORT: If even error handling fails, return minimal valid JSON
      console.error('CRITICAL: Error handler itself failed:', innerError)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Internal server error. Please try again later.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }
}