import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders } from '@/lib/security'

export async function GET(request: NextRequest) {
  const diagnostics = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    checks: {
      googleAIModule: false,
      googleAIModuleError: null as string | null,
      apiKeyProvided: false,
      apiKeyFormat: null as string | null,
      modelInitialization: false,
      modelInitializationError: null as string | null,
    }
  }

  try {
    // Check 1: Can we import the Google AI module?
    console.log('🔍 Starting Google AI diagnostics...')
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      diagnostics.checks.googleAIModule = true
      console.log('✅ Google AI module imported successfully')

      // Check 2: Is there an API key in the request?
      const authHeader = request.headers.get('authorization')
      const apiKey = authHeader?.replace('Bearer ', '')

      if (apiKey) {
        diagnostics.checks.apiKeyProvided = true
        console.log('✅ API key provided in request')

        // Check 3: Validate API key format
        const keyFormat = `Length: ${apiKey.length}, Starts with: ${apiKey.substring(0, 2)}`
        diagnostics.checks.apiKeyFormat = keyFormat
        console.log(`🔍 API key format: ${keyFormat}`)

        // Check 4: Can we initialize the model?
        try {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
          diagnostics.checks.modelInitialization = true
          console.log('✅ Google AI model initialized successfully')
          diagnostics.status = 'healthy'
        } catch (modelError) {
          const errorMsg = modelError instanceof Error ? modelError.message : String(modelError)
          const errorStack = modelError instanceof Error ? modelError.stack : undefined
          diagnostics.checks.modelInitializationError = errorMsg
          diagnostics.status = 'model_error'
          console.error('❌ Model initialization failed:', errorMsg)
          console.error('❌ Model error stack:', errorStack)
        }
      } else {
        diagnostics.status = 'no_api_key'
        console.warn('⚠️ No API key provided in Authorization header')
      }
    } catch (importError) {
      const errorMsg = importError instanceof Error ? importError.message : String(importError)
      const errorStack = importError instanceof Error ? importError.stack : undefined
      diagnostics.checks.googleAIModuleError = errorMsg
      diagnostics.status = 'import_error'
      console.error('❌ Google AI module import failed:', errorMsg)
      console.error('❌ Import error stack:', errorStack)
      console.error('❌ Import error details:', JSON.stringify({
        message: errorMsg,
        stack: errorStack,
        name: importError instanceof Error ? importError.name : undefined,
        cause: importError instanceof Error ? (importError as any).cause : undefined
      }, null, 2))
    }

    const response = NextResponse.json(diagnostics, { status: 200 })
    return applySecurityHeaders(response)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('❌ Diagnostic check failed:', errorMsg)
    console.error('❌ Diagnostic error stack:', errorStack)

    const response = NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMsg,
      stack: errorStack
    }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

// Also support POST for easier testing with API key in body
export async function POST(request: NextRequest) {
  return GET(request)
}
