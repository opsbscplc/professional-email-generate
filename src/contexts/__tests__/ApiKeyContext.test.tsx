import { renderHook, act } from '@testing-library/react'
import { ApiKeyProvider, useApiKey } from '../ApiKeyContext'
import { validateApiKey } from '@/lib/utils'

// Mock the validateApiKey function
jest.mock('@/lib/utils', () => ({
  validateApiKey: jest.fn(),
}))

const mockValidateApiKey = validateApiKey as jest.MockedFunction<typeof validateApiKey>

describe('ApiKeyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
    
    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1000000)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ApiKeyProvider>{children}</ApiKeyProvider>
  )

  it('initializes with no API key', () => {
    const { result } = renderHook(() => useApiKey(), { wrapper })

    expect(result.current.apiKey).toBeNull()
    expect(result.current.isValid).toBe(false)
  })

  it('loads valid API key from sessionStorage', () => {
    const mockApiKey = 'AIzaSyDummyKeyForTesting123456789'
    const mockTimestamp = '999000' // Within timeout period
    
    const mockGetItem = window.sessionStorage.getItem as jest.Mock
    mockGetItem.mockImplementation((key: string) => {
      if (key === 'gemini_api_key') return mockApiKey
      if (key === 'gemini_api_key_timestamp') return mockTimestamp
      return null
    })
    
    mockValidateApiKey.mockReturnValue(true)

    const { result } = renderHook(() => useApiKey(), { wrapper })

    expect(result.current.apiKey).toBe(mockApiKey)
    expect(result.current.isValid).toBe(true)
  })

  it('clears expired API key from sessionStorage', () => {
    const mockApiKey = 'AIzaSyDummyKeyForTesting123456789'
    const mockTimestamp = '1' // Expired timestamp
    
    const mockGetItem = window.sessionStorage.getItem as jest.Mock
    mockGetItem.mockImplementation((key: string) => {
      if (key === 'gemini_api_key') return mockApiKey
      if (key === 'gemini_api_key_timestamp') return mockTimestamp
      return null
    })

    const { result } = renderHook(() => useApiKey(), { wrapper })

    expect(result.current.apiKey).toBeNull()
    expect(result.current.isValid).toBe(false)
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('gemini_api_key')
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('gemini_api_key_timestamp')
  })

  it('sets and stores valid API key', () => {
    const mockApiKey = 'AIzaSyDummyKeyForTesting123456789'
    mockValidateApiKey.mockReturnValue(true)

    const { result } = renderHook(() => useApiKey(), { wrapper })

    act(() => {
      result.current.setApiKey(mockApiKey)
    })

    expect(result.current.apiKey).toBe(mockApiKey)
    expect(result.current.isValid).toBe(true)
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('gemini_api_key', mockApiKey)
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('gemini_api_key_timestamp', '1000000')
  })

  it('rejects invalid API key', () => {
    const mockApiKey = 'invalid-key'
    mockValidateApiKey.mockReturnValue(false)

    const { result } = renderHook(() => useApiKey(), { wrapper })

    expect(() => {
      act(() => {
        result.current.setApiKey(mockApiKey)
      })
    }).toThrow('Invalid API key format')

    expect(result.current.apiKey).toBeNull()
    expect(result.current.isValid).toBe(false)
  })

  it('clears API key', () => {
    const mockApiKey = 'AIzaSyDummyKeyForTesting123456789'
    mockValidateApiKey.mockReturnValue(true)

    const { result } = renderHook(() => useApiKey(), { wrapper })

    // First set an API key
    act(() => {
      result.current.setApiKey(mockApiKey)
    })

    expect(result.current.apiKey).toBe(mockApiKey)
    expect(result.current.isValid).toBe(true)

    // Then clear it
    act(() => {
      result.current.clearApiKey()
    })

    expect(result.current.apiKey).toBeNull()
    expect(result.current.isValid).toBe(false)
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('gemini_api_key')
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('gemini_api_key_timestamp')
  })

  it('throws error when used outside provider', () => {
    const { result } = renderHook(() => useApiKey())

    expect(result.error).toEqual(
      Error('useApiKey must be used within an ApiKeyProvider')
    )
  })
})