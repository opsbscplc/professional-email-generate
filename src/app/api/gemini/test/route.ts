import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Basic format validation
    if (typeof apiKey !== 'string' || apiKey.length < 20 || !apiKey.startsWith('AI')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Test the API key with a simple request
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Send a minimal test prompt with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      })

      const apiPromise = model.generateContent('Hi')
      const result = await Promise.race([apiPromise, timeoutPromise]) as any
      
      if (!result || !result.response) {
        throw new Error('No response from Gemini API')
      }

      const responseText = result.response.text()
      if (!responseText) {
        throw new Error('Empty response from Gemini API')
      }

      // If we get here, the API key is valid
      return NextResponse.json({ 
        success: true, 
        message: 'API key is valid' 
      })

    } catch (apiError) {
      throw apiError
    }

  } catch (error) {
    console.error('API key validation error:', error)
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('api_key_invalid') || errorMessage.includes('invalid api key')) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Google Gemini API key.' },
          { status: 401 }
        )
      }
      
      if (errorMessage.includes('permission_denied') || errorMessage.includes('permission denied')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure your API key has the necessary permissions.' },
          { status: 403 }
        )
      }
      
      if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota exceeded') || errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { 
            success: true, 
            message: 'API key is valid but currently rate-limited. The system will automatically use backup services when needed.',
            warning: 'Rate limited - backup services available'
          },
          { status: 200 }
        )
      }

      if (errorMessage.includes('429') || errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('too many')) {
        return NextResponse.json(
          { 
            success: true, 
            message: 'API key is valid but currently rate-limited. The system will automatically use backup services when needed.',
            warning: 'Rate limited - backup services available'
          },
          { status: 200 }
        )
      }

      if (errorMessage.includes('fetch')) {
        return NextResponse.json(
          { error: 'Network error. Please check your internet connection and try again.' },
          { status: 500 }
        )
      }

      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `API validation failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to validate API key. Please try again.' },
      { status: 500 }
    )
  }
}