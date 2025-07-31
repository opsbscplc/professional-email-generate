export interface GeminiRequest {
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

export enum EmailTemplate {
  PROFESSIONAL = 'professional',
  FRIEND = 'friend',
  POLITE = 'polite',
  DIRECT = 'direct',
  FOLLOWUP = 'followup',
  REMINDER = 'reminder'
}

export interface ApiKeyContextType {
  apiKey: string | null
  setApiKey: (key: string) => void
  clearApiKey: () => void
  isValid: boolean
  sessionExpired?: boolean
}

export interface TemplateState {
  selectedTemplate: EmailTemplate | null
  draftEmail: string
  enhancedEmail: string | null
  isLoading: boolean
  error: string | null
}

export interface TrainerState {
  trainingInput: string
  trainingOutput: string
  testInput: string
  generatedOutput: string | null
  isLoading: boolean
  error: string | null
}