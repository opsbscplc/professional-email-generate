import { validateApiKey, formatError, copyToClipboard, debounce, cn } from '../utils'

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
})

describe('Utils', () => {
  describe('validateApiKey', () => {
    it('validates correct API key format', () => {
      expect(validateApiKey('AIzaSyDummyKeyForTesting123456789')).toBe(true)
      expect(validateApiKey('AIzaSyAnotherValidKey987654321')).toBe(true)
    })

    it('rejects invalid API key formats', () => {
      expect(validateApiKey('')).toBe(false)
      expect(validateApiKey('invalid')).toBe(false)
      expect(validateApiKey('BIzaSyInvalidPrefix123456789')).toBe(false)
      expect(validateApiKey('AI')).toBe(false) // Too short
      expect(validateApiKey('AIzaSy')).toBe(false) // Too short
    })

    it('rejects API keys with invalid characters', () => {
      expect(validateApiKey('AIzaSy@InvalidChar123456789')).toBe(false)
      expect(validateApiKey('AIzaSy Invalid Space123456789')).toBe(false)
      expect(validateApiKey('AIzaSy#InvalidChar123456789')).toBe(false)
    })

    it('handles null and undefined inputs', () => {
      expect(validateApiKey(null as any)).toBe(false)
      expect(validateApiKey(undefined as any)).toBe(false)
    })

    it('trims whitespace', () => {
      expect(validateApiKey('  AIzaSyDummyKeyForTesting123456789  ')).toBe(true)
    })

    it('rejects keys that are too long', () => {
      const longKey = 'AI' + 'a'.repeat(60)
      expect(validateApiKey(longKey)).toBe(false)
    })
  })

  describe('formatError', () => {
    it('formats Error objects', () => {
      const error = new Error('Test error message')
      expect(formatError(error)).toBe('Test error message')
    })

    it('formats unknown errors', () => {
      expect(formatError('string error')).toBe('An unexpected error occurred')
      expect(formatError(null)).toBe('An unexpected error occurred')
      expect(formatError(undefined)).toBe('An unexpected error occurred')
      expect(formatError(123)).toBe('An unexpected error occurred')
    })
  })

  describe('copyToClipboard', () => {
    it('calls navigator.clipboard.writeText', async () => {
      const mockWriteText = navigator.clipboard.writeText as jest.Mock
      mockWriteText.mockResolvedValue(undefined)

      await copyToClipboard('test text')

      expect(mockWriteText).toHaveBeenCalledWith('test text')
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('debounces function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('resets timer on subsequent calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      jest.advanceTimersByTime(50)
      debouncedFn('arg2')
      jest.advanceTimersByTime(50)

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)

      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg2')
    })
  })

  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('handles Tailwind merge conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    })
  })
})