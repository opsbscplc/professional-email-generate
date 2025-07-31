import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApiKeyStatus, ApiKeyGuard } from '../ApiKeyStatus'
import { useApiKey } from '@/contexts/ApiKeyContext'

// Mock the ApiKeyContext
jest.mock('@/contexts/ApiKeyContext')
const mockUseApiKey = useApiKey as jest.MockedFunction<typeof useApiKey>

// Mock the ApiKeyInput component
jest.mock('../ApiKeyInput', () => ({
  ApiKeyInput: ({ onValidKey }: { onValidKey: () => void }) => (
    <div data-testid="api-key-input">
      <button onClick={onValidKey}>Validate Key</button>
    </div>
  ),
}))

describe('ApiKeyStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders API required state when no valid key', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: null,
      isValid: false,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus />)
    
    expect(screen.getByText('API Required')).toBeInTheDocument()
    expect(screen.getByText('Add API Key')).toBeInTheDocument()
    expect(screen.getByTitle('API key required')).toBeInTheDocument()
  })

  it('renders API connected state when valid key exists', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: 'AIzaSyTestKey1234567890',
      isValid: true,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus />)
    
    expect(screen.getByText('API Connected')).toBeInTheDocument()
    expect(screen.getByTitle('API key is valid')).toBeInTheDocument()
    expect(screen.getByText('AIzaSyTe...7890')).toBeInTheDocument()
  })

  it('shows input form when Add API Key is clicked', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: null,
      isValid: false,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus />)
    
    fireEvent.click(screen.getByText('Add API Key'))
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument()
    expect(screen.getByText('API Key Setup')).toBeInTheDocument()
  })

  it('calls clearApiKey when clear button is clicked', () => {
    const mockClearApiKey = jest.fn()
    mockUseApiKey.mockReturnValue({
      apiKey: 'AIzaSyTestKey1234567890',
      isValid: true,
      clearApiKey: mockClearApiKey,
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus />)
    
    fireEvent.click(screen.getByTitle('Clear API key'))
    expect(mockClearApiKey).toHaveBeenCalled()
  })

  it('hides input form after key validation when not in full input mode', async () => {
    mockUseApiKey.mockReturnValue({
      apiKey: null,
      isValid: false,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus />)
    
    fireEvent.click(screen.getByText('Add API Key'))
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Validate Key'))
    
    await waitFor(() => {
      expect(screen.queryByTestId('api-key-input')).not.toBeInTheDocument()
    })
  })

  it('keeps input form visible in full input mode', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: null,
      isValid: false,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(<ApiKeyStatus showFullInput />)
    
    expect(screen.getByTestId('api-key-input')).toBeInTheDocument()
    expect(screen.queryByText('Add API Key')).not.toBeInTheDocument()
  })
})

describe('ApiKeyGuard', () => {
  it('renders children when API key is valid', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: 'valid-key',
      isValid: true,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(
      <ApiKeyGuard>
        <div>Protected Content</div>
      </ApiKeyGuard>
    )
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders API key setup when no valid key', () => {
    mockUseApiKey.mockReturnValue({
      apiKey: null,
      isValid: false,
      clearApiKey: jest.fn(),
      setApiKey: jest.fn(),
    })

    render(
      <ApiKeyGuard>
        <div>Protected Content</div>
      </ApiKeyGuard>
    )
    
    expect(screen.getByText('API Key Required')).toBeInTheDocument()
    expect(screen.getByText('Please enter your Google Gemini API key to use the email template generator.')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})