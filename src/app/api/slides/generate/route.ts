import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Exponential backoff utility for retries
async function exponentialBackoff(attempt: number, maxDelay: number = 10000): Promise<void> {
  const delay = Math.min(Math.pow(2, attempt) * 1000, maxDelay)
  console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}...`)
  await new Promise(resolve => setTimeout(resolve, delay))
}

// OpenAI API configuration (optional - configure via environment variable)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_BASE_URL = 'https://api.openai.com/v1'

// Claude API configuration (you'll need to get your own API key from https://console.anthropic.com/)
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '' // Add your Claude API key to environment variables
const CLAUDE_BASE_URL = 'https://api.anthropic.com/v1'



// Claude API helper function
async function callClaude(prompt: string, timeout: number = 60000): Promise<string> {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured')
  }

  console.log('🤖 Attempting Claude API call...')
  
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Claude request timeout')), timeout)
  })

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  }

  const apiPromise = fetch(`${CLAUDE_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLAUDE_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })

  const response = await Promise.race([apiPromise, timeoutPromise]) as Response
  
  console.log('📥 Claude Response status:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Claude API error details:', errorText)
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error('❌ Invalid Claude response structure:', data)
    throw new Error('Invalid response from Claude API')
  }

  const content = data.content[0].text
  console.log('✅ Claude successful response length:', content?.length || 0)
  
  return content
}

// OpenAI API helper function with retry logic
async function callOpenAI(prompt: string, timeout: number = 60000): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  console.log('🤖 Attempting OpenAI API call...')

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OpenAI request timeout')), timeout)
  })

  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  }

  const apiPromise = fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  const response = await Promise.race([apiPromise, timeoutPromise]) as Response

  console.log('📥 OpenAI Response status:', response.status, response.statusText)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ OpenAI API error details:', errorText)
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    console.error('❌ Invalid OpenAI response structure:', data)
    throw new Error('Invalid response from OpenAI API')
  }

  const content = data.choices[0].message.content
  console.log('✅ OpenAI successful response length:', content?.length || 0)

  return content
}

// Emergency fallback - generates basic slides when all AI services fail
function generateEmergencySlides(topic: string): any[] {
  console.log('🚨 Using emergency fallback slide generation')
  
  const slides = [
    {
      title: `Introduction to ${topic}`,
      content: [
        `Welcome to this presentation on ${topic}`,
        "We'll explore the key concepts and latest developments",
        "This session will provide valuable insights",
        "Let's begin our journey into this fascinating subject"
      ]
    },
    {
      title: "Overview and Background",
      content: [
        `${topic} has evolved significantly over recent years`,
        "Understanding the fundamentals is crucial",
        "Historical context provides important perspective",
        "Current trends shape future developments"
      ]
    },
    {
      title: "Key Components and Elements",
      content: [
        "Several critical components define this field",
        "Each element plays a vital role",
        "Integration between components is essential",
        "Understanding relationships improves comprehension"
      ]
    },
    {
      title: "Current Technologies and Methods",
      content: [
        "Modern approaches have revolutionized the field",
        "Technology continues to drive innovation",
        "Best practices have emerged from experience",
        "Efficiency and effectiveness are key priorities"
      ]
    },
    {
      title: "Latest Developments and Innovations",
      content: [
        "Recent breakthroughs have opened new possibilities",
        "Innovation drives continuous improvement",
        "Emerging technologies show great promise",
        "Research continues to push boundaries"
      ]
    },
    {
      title: "Benefits and Advantages",
      content: [
        "Significant benefits have been demonstrated",
        "Advantages over traditional methods are clear",
        "Cost-effectiveness is an important factor",
        "Performance improvements are measurable"
      ]
    },
    {
      title: "Challenges and Considerations",
      content: [
        "Several challenges must be addressed",
        "Technical limitations require careful consideration",
        "Implementation can be complex",
        "Solutions are being actively developed"
      ]
    },
    {
      title: "Implementation Strategies",
      content: [
        "Successful implementation requires careful planning",
        "Step-by-step approaches work best",
        "Risk management is essential",
        "Stakeholder engagement improves outcomes"
      ]
    },
    {
      title: "Best Practices and Guidelines",
      content: [
        "Industry best practices have been established",
        "Following guidelines ensures success",
        "Experience has taught valuable lessons",
        "Continuous improvement is recommended"
      ]
    },
    {
      title: "Case Studies and Examples",
      content: [
        "Real-world examples demonstrate effectiveness",
        "Case studies provide practical insights",
        "Success stories inspire confidence",
        "Lessons learned guide future projects"
      ]
    },
    {
      title: "Technical Specifications",
      content: [
        "Technical requirements must be clearly defined",
        "Specifications ensure compatibility",
        "Standards promote interoperability",
        "Documentation is crucial for success"
      ]
    },
    {
      title: "Performance and Efficiency",
      content: [
        "Performance metrics guide optimization",
        "Efficiency improvements reduce costs",
        "Monitoring ensures consistent quality",
        "Benchmarking enables comparison"
      ]
    },
    {
      title: "Security and Reliability",
      content: [
        "Security considerations are paramount",
        "Reliability ensures consistent operation",
        "Risk mitigation strategies are essential",
        "Backup systems provide redundancy"
      ]
    },
    {
      title: "Future Trends and Predictions",
      content: [
        "Future developments look promising",
        "Trends indicate continued growth",
        "Predictions suggest exciting possibilities",
        "Innovation will drive future success"
      ]
    },
    {
      title: "Industry Impact and Applications",
      content: [
        "Industry impact has been significant",
        "Applications continue to expand",
        "Market adoption is accelerating",
        "Economic benefits are substantial"
      ]
    },
    {
      title: "Research and Development",
      content: [
        "Ongoing research drives advancement",
        "Development efforts focus on improvement",
        "Collaboration enhances progress",
        "Investment in R&D is increasing"
      ]
    },
    {
      title: "Global Perspectives and Adoption",
      content: [
        "Global adoption varies by region",
        "International cooperation is beneficial",
        "Cultural factors influence implementation",
        "Standardization efforts are ongoing"
      ]
    },
    {
      title: "Economic and Business Implications",
      content: [
        "Economic impact is substantial",
        "Business models are evolving",
        "Investment opportunities are emerging",
        "Market dynamics continue to change"
      ]
    },
    {
      title: "Recommendations and Next Steps",
      content: [
        "Key recommendations have been identified",
        "Next steps should be prioritized",
        "Action plans need to be developed",
        "Implementation should begin promptly"
      ]
    },
    {
      title: "Conclusion and Summary",
      content: [
        `${topic} represents an important and evolving field`,
        "Key points have been covered comprehensively",
        "Future prospects look very promising",
        "Thank you for your attention and engagement"
      ]
    }
  ]
  
  return slides
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

    // Try Gemini first with retry logic
    const maxGeminiRetries = 3
    let geminiError: any = null

    for (let attempt = 0; attempt < maxGeminiRetries; attempt++) {
      try {
        console.log(`Attempting slide generation with Gemini (attempt ${attempt + 1}/${maxGeminiRetries})...`)
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Gemini request timeout')), 45000)
        })

        const slidePromise = model.generateContent(slidePrompt)
        const slideResult = await Promise.race([slidePromise, timeoutPromise]) as any
        const slideResponse = await slideResult.response
        slideText = await slideResponse.text()
        console.log('✅ Gemini slide generation successful')
        geminiError = null
        break // Success, exit retry loop
      } catch (error) {
        geminiError = error
        console.log(`❌ Gemini attempt ${attempt + 1} failed:`, error)

        // Check if it's a rate limit error
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
        const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')

        if (isRateLimit && attempt < maxGeminiRetries - 1) {
          await exponentialBackoff(attempt)
          continue
        } else if (attempt < maxGeminiRetries - 1) {
          // For other errors, wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
      }
    }

    // If Gemini failed after all retries, try fallback services
    if (geminiError) {
      console.log('Gemini failed after all retries, trying fallback services...', geminiError)
      usingFallback = true
      
      // Try Claude first (if API key is configured)
      if (CLAUDE_API_KEY) {
        try {
          console.log('🤖 Trying Claude as fallback...')
          slideText = await callClaude(slidePrompt, 45000)
          console.log('✅ Claude slide generation successful')
        } catch (claudeError) {
          console.log('❌ Claude failed, trying OpenRouter...', claudeError)
          
          // Try OpenAI if Claude fails
          try {
            slideText = await callOpenAI(slidePrompt, 45000)
            console.log('✅ OpenAI slide generation successful')
          } catch (openaiError) {
            console.error('All AI services failed:', { geminiError, claudeError, openaiError })
            console.log('🚨 Using emergency fallback')
            
            const emergencySlides = generateEmergencySlides(topic)
            slideText = JSON.stringify(emergencySlides)
          }
        }
      } else {
        // Try OpenAI if Claude is not configured
        try {
          console.log('🤖 Trying OpenAI as fallback...')
          slideText = await callOpenAI(slidePrompt, 45000)
          console.log('✅ OpenAI slide generation successful')
        } catch (openaiError) {
          console.error('Both Gemini and OpenAI failed:', { geminiError, openaiError })
          console.log('🚨 Using emergency fallback')
          
          const emergencySlides = generateEmergencySlides(topic)
          slideText = JSON.stringify(emergencySlides)
        }
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

        // Use Gemini for speaker notes with retry logic and exponential backoff
        const maxRetries = 3
        let speakerNotesError: any = null

        for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
          try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

            const notesTimeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Gemini speaker notes timeout')), 15000)
            })

            const notesPromise = model.generateContent(notesPrompt)
            const notesResult = await Promise.race([notesPromise, notesTimeoutPromise]) as any
            const notesResponse = await notesResult.response
            speakerNotes = (await notesResponse.text()).trim()
            speakerNotesError = null
            break // Success, exit retry loop
          } catch (error) {
            speakerNotesError = error
            console.log(`❌ Gemini speaker notes attempt ${retryCount + 1} failed for slide ${index + 1}:`, error)

            // Check if it's a rate limit error
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
            const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')

            if (retryCount < maxRetries - 1) {
              if (isRateLimit) {
                await exponentialBackoff(retryCount, 5000) // Shorter max delay for speaker notes
              } else {
                await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)))
              }
              continue
            }
          }
        }

        // If Gemini failed for speaker notes after retries, try fallback services
        if (speakerNotesError) {
          // Try fallback services for speaker notes
          if (CLAUDE_API_KEY) {
            try {
              console.log(`Trying Claude for speaker notes on slide ${index + 1}...`)
              speakerNotes = await callClaude(notesPrompt, 15000)
            } catch (claudeError) {
              console.log(`Claude failed for speaker notes on slide ${index + 1}, trying OpenAI...`)
              try {
                if (OPENAI_API_KEY) {
                  speakerNotes = await callOpenAI(notesPrompt, 15000)
                } else {
                  throw new Error('OpenAI API key not configured')
                }
              } catch (openaiError) {
                console.log(`All AI services failed for speaker notes on slide ${index + 1}:`, openaiError)
                speakerNotes = `Here are some key points to discuss for this slide about ${slide.title.toLowerCase()}. Focus on explaining each bullet point clearly and connecting them to the overall topic of ${topic}. Take your time to elaborate on each point and provide examples where relevant.`
              }
            }
          } else if (OPENAI_API_KEY) {
            // Try OpenAI for speaker notes if Claude is not configured
            try {
              console.log(`Trying OpenAI for speaker notes on slide ${index + 1}...`)
              speakerNotes = await callOpenAI(notesPrompt, 15000)
            } catch (openaiError) {
              console.log(`OpenAI also failed for speaker notes on slide ${index + 1}:`, openaiError)
              speakerNotes = `Here are some key points to discuss for this slide about ${slide.title.toLowerCase()}. Focus on explaining each bullet point clearly and connecting them to the overall topic of ${topic}. Take your time to elaborate on each point and provide examples where relevant.`
            }
          } else {
            // No fallback services configured, use generic speaker notes
            speakerNotes = `Here are some key points to discuss for this slide about ${slide.title.toLowerCase()}. Focus on explaining each bullet point clearly and connecting them to the overall topic of ${topic}. Take your time to elaborate on each point and provide examples where relevant.`
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

    // Handle specific API errors with user-friendly messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // Invalid API key
      if (errorMessage.includes('api_key_invalid') || errorMessage.includes('invalid api key') || errorMessage.includes('invalid_api_key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid API key. Please verify your Google Gemini API key is correct and active.'
          },
          { status: 401 }
        )
      }

      // Permission denied
      if (errorMessage.includes('permission_denied') || errorMessage.includes('permission denied') || errorMessage.includes('403')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied. Please ensure your API key has permission to use Gemini models.'
          },
          { status: 403 }
        )
      }

      // Rate limiting or quota exceeded
      if (errorMessage.includes('quota_exceeded') || errorMessage.includes('quota exceeded') ||
          errorMessage.includes('429') || errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit reached. Please wait a moment and try again, or check your API usage quota.'
          },
          { status: 429 }
        )
      }

      // Model not found
      if (errorMessage.includes('404') || errorMessage.includes('not found') ||
          errorMessage.includes('model') || errorMessage.includes('not available')) {
        return NextResponse.json(
          {
            success: false,
            error: 'The AI model is currently unavailable. This is usually temporary - please try again in a few moments.'
          },
          { status: 503 }
        )
      }

      // Service unavailable
      if (errorMessage.includes('service unavailable') || errorMessage.includes('503') ||
          errorMessage.includes('unavailable') || errorMessage.includes('maintenance')) {
        return NextResponse.json(
          {
            success: false,
            error: 'The AI service is temporarily unavailable. Please try again in a few minutes.'
          },
          { status: 503 }
        )
      }

      // Timeout errors
      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timed out. The service is responding slowly. Please try again.'
          },
          { status: 408 }
        )
      }

      // Network errors
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Network error. Please check your internet connection and try again.'
          },
          { status: 500 }
        )
      }
    }

    // Generic error fallback - don't expose internal error details to users
    console.error('Unhandled error in slide generation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while generating slides. Please try again.'
      },
      { status: 500 }
    )
  }
}