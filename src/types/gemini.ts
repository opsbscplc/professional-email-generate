// Shared types for Gemini API integration

export enum EmailTemplate {
  PROFESSIONAL = 'professional',
  FRIEND = 'friend',
  POLITE = 'polite',
  DIRECT = 'direct',
  FOLLOWUP = 'followup',
  REMINDER = 'reminder'
}

export interface GeminiRequest {
  apiKey: string
  prompt: string
  template?: EmailTemplate
  trainingData?: {
    input: string
    output: string
  }
}

export interface GeminiResponse {
  success: boolean
  data?: string
  error?: string
}