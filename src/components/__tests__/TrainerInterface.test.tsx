import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TrainerInterface } from '../TrainerInterface'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { ApiKeyContextType } from '@/types'

// Mock fetch
global.fetch = jest.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

const mockApiKeyContext: ApiKeyContextType = {
  apiKey: 'test-api-key',
  setApiKey: jest.fn(),
  clearApiKey: jest.fn(),
  isValid: true
}

const mockApiKeyContextNoKey: ApiKeyContextType = {
  apiKey: null,
  setApiKey: jest.fn(),
  clearApiKey: jest.fn(),
  isValid: false
}

// Mock the useApiKey hook
const mockUseApiKey = jest.fn()

jest.mock('@/contexts/ApiKeyContext', () => ({
  ApiKeyProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useApiKey: () => mockUseApiKey()
}))

const renderWithApiKey = (component: React.ReactElement, apiKeyContext = mockApiKeyContext) => {
  mockUseApiKey.mockReturnValue(apiKeyContext)
  return render(component)
}

describe('TrainerInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  describe('Initial Render', () => {
    it('renders the trainer interface with step 1 active', () => {
      renderWithApiKey(<TrainerInterface />)
      
      expect(screen.getByText('AI Trainer - Learn Your Communication Style')).toBeInTheDocument()
      expect(screen.getByText('Step 1: Provide Training Examples')).toBeInTheDocument()
      expect(screen.getByText('Training Examples')).toBeInTheDocument()
      expect(screen.getByLabelText('Training Input Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Training Output Email')).toBeInTheDocument()
    })

    it('shows progress indicator with correct step highlighted', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const stepIndicators = screen.getAllByText(/[1-3]/)
      expect(stepIndicators[0]).toHaveClass('bg-accent-primary')
      expect(stepIndicators[1]).toHaveClass('bg-white/20')
      expect(stepIndicators[2]).toHaveClass('bg-white/20')
    })

    it('shows guidance tips', () => {
      renderWithApiKey(<TrainerInterface />)
      
      expect(screen.getByText('Tips for Better Results')).toBeInTheDocument()
      expect(screen.getByText(/Provide clear, specific examples/)).toBeInTheDocument()
    })
  })

  describe('Training Data Input', () => {
    it('allows input in training fields', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Test training input' } })
      fireEvent.change(trainingOutput, { target: { value: 'Test training output' } })
      
      expect(trainingInput).toHaveValue('Test training input')
      expect(trainingOutput).toHaveValue('Test training output')
    })

    it('disables continue button when fields are empty', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const continueButton = screen.getByText('Continue to Testing')
      expect(continueButton).toBeDisabled()
    })

    it('enables continue button when both fields have content', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Test input' } })
      fireEvent.change(trainingOutput, { target: { value: 'Test output' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      expect(continueButton).not.toBeDisabled()
    })
  })

  describe('Validation', () => {
    it('shows validation errors for short training input', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'short' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      expect(screen.getByText('Training input should be at least 10 characters long')).toBeInTheDocument()
    })

    it('shows validation errors for empty training output', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const trainingInput = screen.getByLabelText('Training Input Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      expect(screen.getByText('Training output email is required')).toBeInTheDocument()
    })

    it('proceeds to testing step when validation passes', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input email' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output email' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      expect(screen.getByText('Test with New Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Email to Transform')).toBeInTheDocument()
    })
  })

  describe('Testing Step', () => {
    beforeEach(() => {
      renderWithApiKey(<TrainerInterface />)
      
      // Fill training data and proceed to testing
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input email' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output email' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
    })

    it('shows testing interface', () => {
      expect(screen.getByText('Test with New Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Email to Transform')).toBeInTheDocument()
      expect(screen.getByText('Back to Training')).toBeInTheDocument()
      expect(screen.getByText('Generate Output')).toBeInTheDocument()
    })

    it('allows going back to training step', () => {
      const backButton = screen.getByText('Back to Training')
      fireEvent.click(backButton)
      
      expect(screen.getByText('Training Examples')).toBeInTheDocument()
    })

    it('validates test input before generating', () => {
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      expect(screen.getByText('Test input email is required')).toBeInTheDocument()
    })

    it('shows error when no API key is available', () => {
      renderWithApiKey(<TrainerInterface />, mockApiKeyContextNoKey)
      
      // Navigate to testing step
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input email' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output email' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      // Try to generate without API key
      const testInput = screen.getByLabelText('Email to Transform')
      fireEvent.change(testInput, { target: { value: 'Test email to transform' } })
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      expect(screen.getByText('API key is required')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    beforeEach(() => {
      renderWithApiKey(<TrainerInterface />)
      
      // Navigate to testing step
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input email' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output email' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      const testInput = screen.getByLabelText('Email to Transform')
      fireEvent.change(testInput, { target: { value: 'Test email to transform' } })
    })

    it('makes API call with correct data', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: 'Generated email output'
        })
      })
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/gemini', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: JSON.stringify({
            prompt: 'Test email to transform',
            trainingData: {
              input: 'Valid training input email',
              output: 'Valid training output email'
            }
          })
        })
      })
    })

    it('shows loading state during API call', async () => {
      ;(fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: 'Generated output' })
        }), 100))
      )
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('handles API success and shows results', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: 'Generated email output'
        })
      })
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Generated Output')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Generated email output')).toBeInTheDocument()
      })
    })

    it('handles API errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'API error message'
        })
      })
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByText('API error message')).toBeInTheDocument()
      })
    })

    it('handles network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('Results Step', () => {
    beforeEach(async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: 'Generated email output'
        })
      })
      
      renderWithApiKey(<TrainerInterface />)
      
      // Navigate through all steps
      const trainingInput = screen.getByLabelText('Training Input Email')
      const trainingOutput = screen.getByLabelText('Training Output Email')
      
      fireEvent.change(trainingInput, { target: { value: 'Valid training input email' } })
      fireEvent.change(trainingOutput, { target: { value: 'Valid training output email' } })
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      const testInput = screen.getByLabelText('Email to Transform')
      fireEvent.change(testInput, { target: { value: 'Test email to transform' } })
      
      const generateButton = screen.getByText('Generate Output')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Generated Output')).toBeInTheDocument()
      })
    })

    it('shows results with input and output comparison', () => {
      expect(screen.getByText('Generated Output')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test email to transform')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Generated email output')).toBeInTheDocument()
    })

    it('allows going back to testing', () => {
      const backButton = screen.getByText('Try Another Email')
      fireEvent.click(backButton)
      
      expect(screen.getByText('Test with New Email')).toBeInTheDocument()
    })

    it('allows starting over', () => {
      const startOverButton = screen.getByText('Start Over')
      fireEvent.click(startOverButton)
      
      expect(screen.getByText('Training Examples')).toBeInTheDocument()
      expect(screen.getByLabelText('Training Input Email')).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for form inputs', () => {
      renderWithApiKey(<TrainerInterface />)
      
      expect(screen.getByLabelText('Training Input Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Training Output Email')).toBeInTheDocument()
    })

    it('shows validation errors with proper association', () => {
      renderWithApiKey(<TrainerInterface />)
      
      const continueButton = screen.getByText('Continue to Testing')
      fireEvent.click(continueButton)
      
      const errorMessage = screen.getByText('Training input email is required')
      expect(errorMessage).toBeInTheDocument()
    })
  })
})