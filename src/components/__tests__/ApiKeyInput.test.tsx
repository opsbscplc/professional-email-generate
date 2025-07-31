import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeyInput } from '../ApiKeyInput'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'

// Mock the API call
global.fetch = jest.fn()

const MockedApiKeyProvider = ({ children }: { children: React.ReactNode }) => (
  <ApiKeyProvider>{children}</ApiKeyProvider>
)

describe('ApiKeyInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders API key input form', () => {
    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    expect(screen.getByText('Google Gemini API Key')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your Google Gemini API key...')).toBeInTheDocument()
    expect(screen.getByText('Validate Key')).toBeInTheDocument()
  })

  it('shows validation error for invalid API key format', async () => {
    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...')
    const validateButton = screen.getByText('Validate Key')

    fireEvent.change(input, { target: { value: 'invalid-key' } })
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText(/Invalid API key format/)).toBeInTheDocument()
    })
  })

  it('validates API key with server call', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'API key is valid' }),
    } as Response)

    const onValidKey = jest.fn()

    render(
      <MockedApiKeyProvider>
        <ApiKeyInput onValidKey={onValidKey} />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...')
    const validateButton = screen.getByText('Validate Key')

    fireEvent.change(input, { target: { value: 'AIzaSyDummyKeyForTesting123456789' } })
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: 'AIzaSyDummyKeyForTesting123456789' }),
      })
    })

    await waitFor(() => {
      expect(screen.getByText('API key validated successfully')).toBeInTheDocument()
    })

    expect(onValidKey).toHaveBeenCalledWith('AIzaSyDummyKeyForTesting123456789')
  })

  it('handles server validation error', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid API key' }),
    } as Response)

    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...')
    const validateButton = screen.getByText('Validate Key')

    fireEvent.change(input, { target: { value: 'AIzaSyDummyKeyForTesting123456789' } })
    fireEvent.click(validateButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid API key')).toBeInTheDocument()
    })
  })

  it('toggles API key visibility', () => {
    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...') as HTMLInputElement
    const toggleButton = screen.getByLabelText('Show API key')

    expect(input.type).toBe('password')

    fireEvent.click(toggleButton)
    expect(input.type).toBe('text')

    fireEvent.click(toggleButton)
    expect(input.type).toBe('password')
  })

  it('clears API key input', () => {
    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'test-key' } })
    expect(input.value).toBe('test-key')

    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)

    expect(input.value).toBe('')
  })

  it('shows loading state during validation', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <MockedApiKeyProvider>
        <ApiKeyInput />
      </MockedApiKeyProvider>
    )

    const input = screen.getByPlaceholderText('Enter your Google Gemini API key...')
    const validateButton = screen.getByText('Validate Key')

    fireEvent.change(input, { target: { value: 'AIzaSyDummyKeyForTesting123456789' } })
    fireEvent.click(validateButton)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(validateButton).toBeDisabled()
  })
})