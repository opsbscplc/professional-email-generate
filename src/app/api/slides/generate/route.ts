import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// OpenRouter KIMI K2 Free API configuration
const OPENROUTER_API_KEY = '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Test OpenRouter API key validity
async function testOpenRouterKey(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://professional-email-generate.vercel.app',
        'X-Title': 'Email Template Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    })
    
    console.log('🔑 OpenRouter key test response:', response.status)
    return response.status !== 401
  } catch (error) {
    console.error('🔑 OpenRouter key test failed:', error)
    return false
  }
}

// OpenRouter KIMI K2 API helper function with comprehensive error handling
async function callKimiK2(prompt: string, timeout: number = 60000): Promise<string> {
  console.log('🚀 Attempting KIMI K2 API call...')
  
  // First test if the API key works at all
  const keyValid = await testOpenRouterKey()
  if (!keyValid) {
    console.error('❌ OpenRouter API key is invalid or expired')
    throw new Error('OpenRouter API key authentication failed')
  }
  
  console.log('✅ OpenRouter API key is valid')
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('KIMI K2 request timeout')), timeout)
  })

  // Try different model configurations
  const modelConfigs = [
    { model: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { model: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
    { model: 'meta-llama/llama-3-8b-instruct:free', name: 'Llama 3 8B' },
    { model: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2' }
  ]

  for (const config of modelConfigs) {
    try {
      console.log(`🧪 Trying ${config.name} (${config.model})...`)
      
      const requestBody = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }

      const apiPromise = fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://professional-email-generate.vercel.app',
          'X-Title': 'Email Template Generator'
        },
        body: JSON.stringify(requestBody)
      })

      const response = await Promise.race([apiPromise, timeoutPromise]) as Response
      
      console.log(`📥 ${config.name} Response status:`, response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const content = data.choices[0].message.content
          console.log(`✅ ${config.name} successful! Response length:`, content?.length || 0)
          return content
        }
      } else {
        const errorText = await response.text()
        console.log(`❌ ${config.name} failed:`, response.status, errorText)
      }
    } catch (error) {
      console.log(`❌ ${config.name} error:`, error)
      continue
    }
  }
  
  throw new Error('All OpenRouter models failed')
}



export async function POST(request: NextRequest) {
  try {
    const { topic, theme, apiKey } = await request.json()

    if (!topic || !theme || !apiKey) {
      return NextResponse.json(
        { error: 'Topic, theme, and API key are required' },
        { status: 400 }
      )
    }

    // Validate API key format
    if (typeof apiKey !== 'string' || apiKey.length < 20 || !apiKey.startsWith('AI')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      )
    }

    // Generate slide content
    const slidePrompt = `Create a comprehensive presentation about "${topic}" with exactly 20 slides. 
    
    For each slide, provide:
    1. A clear, engaging title
    2. 3-5 bullet points of content (keep each point concise and impactful)
    3. Do not include slide numbers in titles
    
    Format the response as a JSON array where each slide has:
    {
      "title": "Slide Title",
      "content": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
    }
    
    Make sure the presentation flows logically from introduction to conclusion. 
    Cover the topic comprehensively with engaging, informative content.
    Use professional language but keep it accessible.
    
    Return only the JSON array, no additional text.`

    let slideText
    let usingFallback = false

    // Try Gemini first
    try {
      console.log('Attempting slide generation with Gemini...')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini request timeout')), 30000)
      })

      const slidePromise = model.generateContent(slidePrompt)
      const slideResult = await Promise.race([slidePromise, timeoutPromise]) as any
      const slideResponse = await slideResult.response
      slideText = slideResponse.text()
      console.log('Gemini slide generation successful')
    } catch (geminiError) {
      console.log('Gemini failed, falling back to KIMI K2...', geminiError)
      usingFallback = true
      
      try {
        slideText = await callKimiK2(slidePrompt, 45000)
        console.log('KIMI K2 slide generation successful')
      } catch (kimiError) {
        console.error('Both Gemini and KIMI K2 failed:', { geminiError, kimiError })
        throw new Error('All AI services are currently unavailable. Please try again later.')
      }
    }

    // Parse the slide content
    let slides
    try {
      slides = JSON.parse(slideText)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = slideText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse slide content')
      }
    }

    // Generate speaker notes for each slide using only Gemini
    const slidesWithNotes = await Promise.all(
      slides.map(async (slide: any, index: number) => {
        const notesPrompt = `Create natural, humanized speaker notes for this presentation slide about "${topic}":

Title: ${slide.title}
Content: ${slide.content.join(', ')}

Generate speaker notes that:
- Sound conversational and human-like
- Use simple, short sentences
- Avoid corporate jargon or overly formal language
- Include natural transitions and pauses
- Are about 2-3 sentences long
- Help the presenter explain the slide content naturally

Return only the speaker notes text, nothing else.`

        let speakerNotes = ''

        // Use Gemini for speaker notes with retry logic
        let retryCount = 0
        const maxRetries = 2
        
        while (retryCount <= maxRetries) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
            
            const notesTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Gemini speaker notes timeout')), 10000)
            })
            
            const notesPromise = model.generateContent(notesPrompt)
            const notesResult = await Promise.race([notesPromise, notesTimeoutPromise]) as any
            const notesResponse = await notesResult.response
            speakerNotes = notesResponse.text().trim()
            break // Success, exit retry loop
          } catch (geminiError) {
            retryCount++
            console.log(`Gemini speaker notes attempt ${retryCount} failed for slide ${index + 1}:`, geminiError)
            
            if (retryCount > maxRetries) {
              // Try KIMI K2 as final fallback for speaker notes
              try {
                console.log(`Trying KIMI K2 for speaker notes on slide ${index + 1}...`)
                speakerNotes = await callKimiK2(notesPrompt, 15000)
              } catch (kimiError) {
                console.log(`KIMI K2 also failed for speaker notes on slide ${index + 1}:`, kimiError)
                speakerNotes = `Here are some key points to discuss for this slide about ${slide.title.toLowerCase()}. Focus on explaining each bullet point clearly and connecting them to the overall topic of ${topic}.`
              }
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            }
          }
        }

        return {
          id: `slide-${index + 1}`,
          title: slide.title,
          content: slide.content,
          speakerNotes,
          slideNumber: index + 1
        }
      })
    )

    const presentation = {
      id: `presentation-${Date.now()}`,
      topic,
      theme,
      slides: slidesWithNotes,
      createdAt: new Date()
    }

    return NextResponse.json({
      success: true,
      data: presentation
    })

  } catch (error) {
    console.error('Slide generation error:', error)
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('api_key_invalid') || errorMessage.includes('invalid api key')) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key. Please check your Google Gemini API key.' },
          { status: 401 }
        )
      }
      
      if (errorMessage.includes('permission_denied') || errorMessage.includes('permission denied')) {
        return NextResponse.json(
          { success: false, error: 'Permission denied. Please ensure your API key has the necessary permissions.' },
          { status: 403 }
        )
      }
      
      if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota exceeded')) {
        return NextResponse.json(
          { success: false, error: 'API quota exceeded. Please check your usage limits.' },
          { status: 429 }
        )
      }

      if (errorMessage.includes('service unavailable') || errorMessage.includes('503') || errorMessage.includes('all gemini models are currently unavailable')) {
        return NextResponse.json(
          { success: false, error: 'All Gemini AI models are temporarily unavailable. This usually resolves within a few minutes. Please try again shortly.' },
          { status: 503 }
        )
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        return NextResponse.json(
          { success: false, error: 'Request timeout. The AI service is taking longer than expected. Please try again.' },
          { status: 408 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate slides. Please try again.' 
      },
      { status: 500 }
    )
  }
}