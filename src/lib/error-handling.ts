export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

export class AppError extends Error {
  public readonly code?: string
  public readonly status?: number
  public readonly details?: any
  public readonly userMessage: string

  constructor(
    message: string,
    userMessage?: string,
    code?: string,
    status?: number,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.userMessage = userMessage || this.getUserFriendlyMessage(message, code)
    this.code = code
    this.status = status
    this.details = details
  }

  private getUserFriendlyMessage(message: string, code?: string): string {
    // Map technical errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'INVALID_API_KEY': 'Your API key is invalid. Please check and try again.',
      'API_KEY_EXPIRED': 'Your API key has expired. Please update it.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
      'NETWORK_ERROR': 'Network connection failed. Please check your internet connection.',
      'TIMEOUT': 'Request timed out. Please try again.',
      'INVALID_INPUT': 'Please check your input and try again.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily unavailable. Please try again later.',
      'QUOTA_EXCEEDED': 'API quota exceeded. Please try again later or upgrade your plan.',
    }

    if (code && errorMap[code]) {
      return errorMap[code]
    }

    // Fallback based on message content
    if (message.toLowerCase().includes('api key')) {
      return 'There\'s an issue with your API key. Please check it and try again.'
    }
    
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      return 'Connection failed. Please check your internet connection and try again.'
    }
    
    if (message.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    
    if (message.toLowerCase().includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.'
    }

    return 'Something went wrong. Please try again.'
  }
}

export function parseApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Parse different types of errors
    if (error.message.includes('Failed to fetch')) {
      return new AppError(
        error.message,
        'Network connection failed. Please check your internet connection.',
        'NETWORK_ERROR'
      )
    }

    if (error.message.includes('timeout')) {
      return new AppError(
        error.message,
        'Request timed out. Please try again.',
        'TIMEOUT'
      )
    }

    return new AppError(error.message)
  }

  if (typeof error === 'string') {
    return new AppError(error)
  }

  return new AppError('An unexpected error occurred', 'Something went wrong. Please try again.')
}

export function parseGeminiApiError(response: Response, data?: any): AppError {
  const status = response.status
  
  switch (status) {
    case 400:
      if (data?.error?.message?.includes('API key')) {
        return new AppError(
          'Invalid API key',
          'Your API key is invalid. Please check and try again.',
          'INVALID_API_KEY',
          400
        )
      }
      return new AppError(
        data?.error?.message || 'Bad request',
        'Please check your input and try again.',
        'INVALID_INPUT',
        400
      )
    
    case 401:
      return new AppError(
        'Unauthorized',
        'Your API key is invalid or expired. Please update it.',
        'INVALID_API_KEY',
        401
      )
    
    case 403:
      return new AppError(
        'Forbidden',
        'API access denied. Please check your API key permissions.',
        'API_KEY_EXPIRED',
        403
      )
    
    case 429:
      return new AppError(
        'Rate limited',
        'Too many requests. Please wait a moment and try again.',
        'RATE_LIMITED',
        429
      )
    
    case 500:
    case 502:
    case 503:
    case 504:
      return new AppError(
        'Service error',
        'Service is temporarily unavailable. Please try again later.',
        'SERVICE_UNAVAILABLE',
        status
      )
    
    default:
      return new AppError(
        data?.error?.message || `HTTP ${status}`,
        'Something went wrong. Please try again.',
        'UNKNOWN_ERROR',
        status
      )
  }
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export function validateEmailInput(input: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!input || input.trim().length === 0) {
    errors.push({
      field: 'email',
      message: 'Email content is required',
      code: 'REQUIRED'
    })
    return errors
  }
  
  if (input.trim().length < 10) {
    errors.push({
      field: 'email',
      message: 'Email content is too short (minimum 10 characters)',
      code: 'TOO_SHORT'
    })
  }
  
  if (input.length > 5000) {
    errors.push({
      field: 'email',
      message: 'Email content is too long (maximum 5000 characters)',
      code: 'TOO_LONG'
    })
  }
  
  return errors
}

export function validateTrainingData(input: string, output: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (!input || input.trim().length === 0) {
    errors.push({
      field: 'trainingInput',
      message: 'Training input is required',
      code: 'REQUIRED'
    })
  }
  
  if (!output || output.trim().length === 0) {
    errors.push({
      field: 'trainingOutput',
      message: 'Training output is required',
      code: 'REQUIRED'
    })
  }
  
  if (input && input.trim().length < 10) {
    errors.push({
      field: 'trainingInput',
      message: 'Training input is too short (minimum 10 characters)',
      code: 'TOO_SHORT'
    })
  }
  
  if (output && output.trim().length < 10) {
    errors.push({
      field: 'trainingOutput',
      message: 'Training output is too short (minimum 10 characters)',
      code: 'TOO_SHORT'
    })
  }
  
  if (input && input.length > 2000) {
    errors.push({
      field: 'trainingInput',
      message: 'Training input is too long (maximum 2000 characters)',
      code: 'TOO_LONG'
    })
  }
  
  if (output && output.length > 2000) {
    errors.push({
      field: 'trainingOutput',
      message: 'Training output is too long (maximum 2000 characters)',
      code: 'TOO_LONG'
    })
  }
  
  return errors
}

export function getErrorRecoveryActions(error: AppError): Array<{
  label: string
  action: string
  primary?: boolean
}> {
  const actions: Array<{ label: string; action: string; primary?: boolean }> = []
  
  switch (error.code) {
    case 'INVALID_API_KEY':
    case 'API_KEY_EXPIRED':
      actions.push(
        { label: 'Update API Key', action: 'update_api_key', primary: true },
        { label: 'Get API Key Help', action: 'api_key_help' }
      )
      break
    
    case 'RATE_LIMITED':
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Wait 1 Minute', action: 'wait' }
      )
      break
    
    case 'NETWORK_ERROR':
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Check Connection', action: 'check_connection' }
      )
      break
    
    case 'TIMEOUT':
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Reduce Content', action: 'reduce_content' }
      )
      break
    
    case 'INVALID_INPUT':
      actions.push(
        { label: 'Fix Input', action: 'fix_input', primary: true },
        { label: 'Get Help', action: 'get_help' }
      )
      break
    
    default:
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Refresh Page', action: 'refresh' }
      )
  }
  
  return actions
}