import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation((apiKey: string) => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockImplementation(() => {
        if (apiKey === 'INVALID_KEY') {
          throw new Error('API_KEY_INVALID')
        }
        if (apiKey === 'PERMISSION_DENIED_KEY') {
          throw new Error('PERMISSION_DENIED')
        }
        if (apiKey === 'QUOTA_EXCEEDED_KEY') {
          throw new Error('QUOTA_EXCEEDED')
        }
        return Promise.resolve({
          response: { text: () => 'Test response' }
        })
      })
    })
  }))
}))

describe('/api/gemini/test', () => {
  it('validates a correct API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyDummyKeyForTesting123456789' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('API key is valid')
  })

  it('rejects request without API key', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('API key is required')
  })

  it('rejects API key with invalid format', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'invalid-key' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid API key format')
  })

  it('handles invalid API key error from Gemini', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'INVALID_KEY' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid API key. Please check your Google Gemini API key.')
  })

  it('handles permission denied error from Gemini', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'PERMISSION_DENIED_KEY' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Permission denied. Please ensure your API key has the necessary permissions.')
  })

  it('handles quota exceeded error from Gemini', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'QUOTA_EXCEEDED_KEY' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('API quota exceeded. Please check your usage limits.')
  })

  it('handles generic errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/gemini/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'AIzaSyGenericErrorKey123456789' }),
      headers: { 'Content-Type': 'application/json' },
    })

    // Mock console.error to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    // Mock a generic error
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: () => Promise.reject(new Error('Generic error'))
      })
    }))

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to validate API key. Please try again.')

    consoleSpy.mockRestore()
  })
})