import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// OpenRouter fallback configuration
const OPENROUTER_API_KEY = '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// OpenRouter API helper function
async function callOpenRouter(prompt: string, timeout: number = 45000): Promise<string> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OpenRouter request timeout')), timeout)
  })

  const apiPromise = fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://professional-email-generate.vercel.app',
      'X-Title': 'Email Template Generator'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  })

  const response = await Promise.race([apiPromise, timeoutPromise]) as Response
  
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenRouter API')
  }

  return data.choices[0].message.content
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
      console.log('Gemini failed, falling back to OpenRouter...', geminiError)
      usingFallback = true
      
      try {
        slideText = await callOpenRouter(slidePrompt, 45000)
        console.log('OpenRouter slide generation successful')
      } catch (openrouterError) {
        console.error('Both Gemini and OpenRouter failed:', { geminiError, openrouterError })
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

    // Generate speaker notes for each slide
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

        // Try the same service that worked for slides first
        if (usingFallback) {
          // Use OpenRouter for speaker notes
          try {
            speakerNotes = await callOpenRouter(notesPrompt, 15000)
          } catch (openrouterError) {
            console.log('OpenRouter failed for speaker notes, trying Gemini...')
            try {
              const genAI = new GoogleGenerativeAI(apiKey)
              const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
              const notesResult = await model.generateContent(notesPrompt)
              const notesResponse = await notesResult.response
              speakerNotes = notesResponse.text().trim()
            } catch (geminiError) {
              speakerNotes = 'Speaker notes could not be generated for this slide.'
            }
          }
        } else {
          // Use Gemini for speaker notes
          try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
            const notesTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Gemini speaker notes timeout')), 15000)
            })
            const notesPromise = model.generateContent(notesPrompt)
            const notesResult = await Promise.race([notesPromise, notesTimeoutPromise]) as any
            const notesResponse = await notesResult.response
            speakerNotes = notesResponse.text().trim()
          } catch (geminiError) {
            console.log('Gemini failed for speaker notes, trying OpenRouter...')
            try {
              speakerNotes = await callOpenRouter(notesPrompt, 15000)
            } catch (openrouterError) {
              speakerNotes = 'Speaker notes could not be generated for this slide.'
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