import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Use the most reliable current model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

    // Generate slides with retry logic
    let slideText
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout - slide generation took too long')), 45000)
        })

        const slidePromise = model.generateContent(slidePrompt)
        const slideResult = await Promise.race([slidePromise, timeoutPromise]) as any
        const slideResponse = await slideResult.response
        slideText = slideResponse.text()
        break // Success, exit retry loop
      } catch (retryError) {
        retryCount++
        if (retryCount >= maxRetries) {
          throw retryError // Re-throw the last error
        }
        console.log(`Slide generation attempt ${retryCount} failed, retrying...`)
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
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

        // Add timeout to speaker notes generation
        const notesTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout - speaker notes generation took too long')), 15000)
        })

        const notesPromise = model.generateContent(notesPrompt)
        const notesResult = await Promise.race([notesPromise, notesTimeoutPromise]) as any
        const notesResponse = await notesResult.response
        const speakerNotes = notesResponse.text().trim()

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