import {
  AppError,
  parseApiError,
  parseGeminiApiError,
  validateEmailInput,
  validateTrainingData,
  getErrorRecoveryActions,
} from '../error-handling'

describe('AppError', () => {
  it('creates error with user-friendly message', () => {
    const error = new AppError('Technical error', 'User friendly message', 'TEST_CODE')
    
    expect(error.message).toBe('Technical error')
    expect(error.userMessage).toBe('User friendly message')
    expect(error.code).toBe('TEST_CODE')
  })

  it('generates user-friendly message from technical message', () => {
    const error = new AppError('Invalid API key provided')
    
    expect(error.userMessage).toContain('API key')
  })

  it('handles network errors', () => {
    const error = new AppError('Network request failed')
    
    expect(error.userMessage).toContain('Connection failed')
  })

  it('handles timeout errors', () => {
    const error = new AppError('Request timeout occurred')
    
    expect(error.userMessage).toContain('timed out')
  })

  it('handles rate limit errors', () => {
    const error = new AppError('Rate limit exceeded')
    
    expect(error.userMessage).toContain('Too many requests')
  })
})

describe('parseApiError', () => {
  it('returns AppError as-is', () => {
    const originalError = new AppError('Test error')
    const result = parseApiError(originalError)
    
    expect(result).toBe(originalError)
  })

  it('converts Error to AppError', () => {
    const originalError = new Error('Test error')
    const result = parseApiError(originalError)
    
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('Test error')
  })

  it('handles fetch errors', () => {
    const originalError = new Error('Failed to fetch')
    const result = parseApiError(originalError)
    
    expect(result.code).toBe('NETWORK_ERROR')
    expect(result.userMessage).toContain('Network connection failed')
  })

  it('handles timeout errors', () => {
    const originalError = new Error('Request timeout')
    const result = parseApiError(originalError)
    
    expect(result.code).toBe('TIMEOUT')
    expect(result.userMessage).toContain('timed out')
  })

  it('handles string errors', () => {
    const result = parseApiError('String error message')
    
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('String error message')
  })

  it('handles unknown error types', () => {
    const result = parseApiError({ unknown: 'object' })
    
    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('An unexpected error occurred')
  })
})

describe('parseGeminiApiError', () => {
  const createMockResponse = (status: number): Response => ({
    status,
    ok: status >= 200 && status < 300,
  } as Response)

  it('handles 400 bad request with API key error', () => {
    const response = createMockResponse(400)
    const data = { error: { message: 'Invalid API key provided' } }
    
    const result = parseGeminiApiError(response, data)
    
    expect(result.code).toBe('INVALID_API_KEY')
    expect(result.status).toBe(400)
    expect(result.userMessage).toContain('API key is invalid')
  })

  it('handles 400 bad request with general error', () => {
    const response = createMockResponse(400)
    const data = { error: { message: 'Invalid request format' } }
    
    const result = parseGeminiApiError(response, data)
    
    expect(result.code).toBe('INVALID_INPUT')
    expect(result.status).toBe(400)
  })

  it('handles 401 unauthorized', () => {
    const response = createMockResponse(401)
    
    const result = parseGeminiApiError(response)
    
    expect(result.code).toBe('INVALID_API_KEY')
    expect(result.status).toBe(401)
    expect(result.userMessage).toContain('invalid or expired')
  })

  it('handles 403 forbidden', () => {
    const response = createMockResponse(403)
    
    const result = parseGeminiApiError(response)
    
    expect(result.code).toBe('API_KEY_EXPIRED')
    expect(result.status).toBe(403)
  })

  it('handles 429 rate limited', () => {
    const response = createMockResponse(429)
    
    const result = parseGeminiApiError(response)
    
    expect(result.code).toBe('RATE_LIMITED')
    expect(result.status).toBe(429)
    expect(result.userMessage).toContain('Too many requests')
  })

  it('handles 500 server error', () => {
    const response = createMockResponse(500)
    
    const result = parseGeminiApiError(response)
    
    expect(result.code).toBe('SERVICE_UNAVAILABLE')
    expect(result.status).toBe(500)
    expect(result.userMessage).toContain('temporarily unavailable')
  })

  it('handles unknown status codes', () => {
    const response = createMockResponse(418)
    const data = { error: { message: 'I am a teapot' } }
    
    const result = parseGeminiApiError(response, data)
    
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.status).toBe(418)
  })
})

describe('validateEmailInput', () => {
  it('validates empty input', () => {
    const errors = validateEmailInput('')
    
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('REQUIRED')
    expect(errors[0].field).toBe('email')
  })

  it('validates whitespace-only input', () => {
    const errors = validateEmailInput('   ')
    
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('REQUIRED')
  })

  it('validates too short input', () => {
    const errors = validateEmailInput('short')
    
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('TOO_SHORT')
    expect(errors[0].message).toContain('minimum 10 characters')
  })

  it('validates too long input', () => {
    const longInput = 'a'.repeat(5001)
    const errors = validateEmailInput(longInput)
    
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('TOO_LONG')
    expect(errors[0].message).toContain('maximum 5000 characters')
  })

  it('validates valid input', () => {
    const errors = validateEmailInput('This is a valid email content that is long enough')
    
    expect(errors).toHaveLength(0)
  })
})

describe('validateTrainingData', () => {
  it('validates empty training input', () => {
    const errors = validateTrainingData('', 'output')
    
    expect(errors.some(e => e.field === 'trainingInput' && e.code === 'REQUIRED')).toBe(true)
  })

  it('validates empty training output', () => {
    const errors = validateTrainingData('input', '')
    
    expect(errors.some(e => e.field === 'trainingOutput' && e.code === 'REQUIRED')).toBe(true)
  })

  it('validates too short training input', () => {
    const errors = validateTrainingData('short', 'This is a valid output')
    
    expect(errors.some(e => e.field === 'trainingInput' && e.code === 'TOO_SHORT')).toBe(true)
  })

  it('validates too short training output', () => {
    const errors = validateTrainingData('This is a valid input', 'short')
    
    expect(errors.some(e => e.field === 'trainingOutput' && e.code === 'TOO_SHORT')).toBe(true)
  })

  it('validates too long training input', () => {
    const longInput = 'a'.repeat(2001)
    const errors = validateTrainingData(longInput, 'This is a valid output')
    
    expect(errors.some(e => e.field === 'trainingInput' && e.code === 'TOO_LONG')).toBe(true)
  })

  it('validates too long training output', () => {
    const longOutput = 'a'.repeat(2001)
    const errors = validateTrainingData('This is a valid input', longOutput)
    
    expect(errors.some(e => e.field === 'trainingOutput' && e.code === 'TOO_LONG')).toBe(true)
  })

  it('validates valid training data', () => {
    const errors = validateTrainingData(
      'This is a valid training input',
      'This is a valid training output'
    )
    
    expect(errors).toHaveLength(0)
  })
})

describe('getErrorRecoveryActions', () => {
  it('provides API key actions for invalid API key', () => {
    const error = new AppError('Invalid API key', 'API key error', 'INVALID_API_KEY')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'update_api_key')).toBe(true)
    expect(actions.some(a => a.action === 'api_key_help')).toBe(true)
  })

  it('provides retry actions for rate limiting', () => {
    const error = new AppError('Rate limited', 'Too many requests', 'RATE_LIMITED')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'retry')).toBe(true)
    expect(actions.some(a => a.action === 'wait')).toBe(true)
  })

  it('provides network actions for network errors', () => {
    const error = new AppError('Network error', 'Connection failed', 'NETWORK_ERROR')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'retry')).toBe(true)
    expect(actions.some(a => a.action === 'check_connection')).toBe(true)
  })

  it('provides timeout actions for timeout errors', () => {
    const error = new AppError('Timeout', 'Request timed out', 'TIMEOUT')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'retry')).toBe(true)
    expect(actions.some(a => a.action === 'reduce_content')).toBe(true)
  })

  it('provides input actions for invalid input', () => {
    const error = new AppError('Invalid input', 'Please check input', 'INVALID_INPUT')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'fix_input')).toBe(true)
    expect(actions.some(a => a.action === 'get_help')).toBe(true)
  })

  it('provides default actions for unknown errors', () => {
    const error = new AppError('Unknown error', 'Something went wrong', 'UNKNOWN')
    const actions = getErrorRecoveryActions(error)
    
    expect(actions.some(a => a.action === 'retry')).toBe(true)
    expect(actions.some(a => a.action === 'refresh')).toBe(true)
  })

  it('marks primary actions correctly', () => {
    const error = new AppError('Invalid API key', 'API key error', 'INVALID_API_KEY')
    const actions = getErrorRecoveryActions(error)
    
    const primaryAction = actions.find(a => a.primary)
    expect(primaryAction?.action).toBe('update_api_key')
  })
})