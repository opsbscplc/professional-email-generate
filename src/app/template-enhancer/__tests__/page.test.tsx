import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import TemplateEnhancerPage from '../page'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { EmailTemplate } from '@/types/gemini'

// Mock the API route
global.fetch = jest.fn()

// Mock the clipboard API
const mockWriteText = jest.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// Helper component to wrap with context
const TestWrapper = ({ children, apiKey = 'AIzaSyTest123456789012345678901234567890' }: { 
  children: React.ReactNode
  apiKey?: string | null 
}) => (
  <ApiKeyProvider initialApiKey={apiKey}>
    {children}
  </ApiKeyProvider>
)

describe('TemplateEnhancerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
  })

  it('shows API key input when no API key is provided', () => {
    render(
      <TestWrapper apiKey={null}>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    expect(screen.getByText('Email Template Enhancer')).toBeInTheDocument()
    expect(screen.getByText('Please provide your Google Gemini API key to start enhancing your emails')).toBeInTheDocument()
  })

  it('renders main interface when API key is available', () => {
    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    expect(screen.getByText('Email Template Enhancer')).toBeInTheDocument()
    expect(screen.getByText('Select a template and enhance your email draft with AI-powered improvements')).toBeInTheDocument()
    expect(screen.getByText('Choose Email Template')).toBeInTheDocument()
    expect(screen.getByText('Your Email Draft')).toBeInTheDocument()
  })

  it('displays all template options', () => {
    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
    expect(screen.getByText('Polite')).toBeInTheDocument()
    expect(screen.getByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('Follow up')).toBeInTheDocument()
    expect(screen.getByText('Reminder')).toBeInTheDocument()
  })

  it('enables enhance button only when template and draft are provided', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    const enhanceButton = screen.getByText('Enhance Email')
    expect(enhanceButton).toBeDisabled()

    // Select a template
    fireEvent.click(screen.getByText('Professional'))
    expect(enhanceButton).toBeDisabled()

    // Add draft text
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    await waitFor(() => {
      expect(enhanceButton).toBeEnabled()
    })
  })

  it('successfully enhances email with valid response', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      success: true,
      data: 'Dear Colleague,\n\nI hope this message finds you well. This is an enhanced professional email.\n\nBest regards'
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Click enhance button
    const enhanceButton = screen.getByText('Enhance Email')
    fireEvent.click(enhanceButton)

    // Check loading state
    expect(screen.getByText('Enhancing your email...')).toBeInTheDocument()

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Enhancement Results')).toBeInTheDocument()
    })

    expect(screen.getByText('Your email has been enhanced using the')).toBeInTheDocument()
    expect(screen.getByText('professional')).toBeInTheDocument()
    expect(screen.getByText('template')).toBeInTheDocument()
    expect(screen.getByDisplayValue(mockResponse.data)).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    const mockErrorResponse = {
      success: false,
      error: 'Invalid API key'
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockErrorResponse)
    })

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Click enhance button
    const enhanceButton = screen.getByText('Enhance Email')
    fireEvent.click(enhanceButton)

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Enhancement Failed')).toBeInTheDocument()
      expect(screen.getByText('Invalid API key')).toBeInTheDocument()
    })
  })

  it('handles network errors', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Click enhance button
    const enhanceButton = screen.getByText('Enhance Email')
    fireEvent.click(enhanceButton)

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText('Enhancement Failed')).toBeInTheDocument()
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
    })
  })

  it('allows retrying after error', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Click enhance button
    const enhanceButton = screen.getByText('Enhance Email')
    fireEvent.click(enhanceButton)

    // Wait for error and retry
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Try Again'))
    expect(screen.queryByText('Enhancement Failed')).not.toBeInTheDocument()
  })

  it('allows dismissing errors', async () => {
    const user = userEvent.setup()
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Click enhance button
    const enhanceButton = screen.getByText('Enhance Email')
    fireEvent.click(enhanceButton)

    // Wait for error and dismiss
    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Dismiss'))
    expect(screen.queryByText('Enhancement Failed')).not.toBeInTheDocument()
  })

  it('allows starting over after successful enhancement', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      success: true,
      data: 'Enhanced email content'
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Hello, this is a test email.')

    // Enhance email
    fireEvent.click(screen.getByText('Enhance Email'))

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Enhancement Results')).toBeInTheDocument()
    })

    // Click start over
    fireEvent.click(screen.getByText('Start Over'))

    // Check that form is reset
    expect(screen.queryByText('Enhancement Results')).not.toBeInTheDocument()
    expect(textarea).toHaveValue('')
    expect(screen.queryByText('✓ Professional template selected')).not.toBeInTheDocument()
  })

  it('sends correct API request format', async () => {
    const user = userEvent.setup()
    const mockResponse = { success: true, data: 'Enhanced email' }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Test email content')

    // Click enhance button
    fireEvent.click(screen.getByText('Enhance Email'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: 'AIzaSyTest123456789012345678901234567890',
          prompt: 'Test email content',
          template: EmailTemplate.PROFESSIONAL
        }),
      })
    })
  })

  it('shows copy functionality in results', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      success: true,
      data: 'Enhanced email content'
    }

    mockWriteText.mockResolvedValue(undefined)
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse)
    })

    render(
      <TestWrapper>
        <TemplateEnhancerPage />
      </TestWrapper>
    )

    // Select template and enter draft
    fireEvent.click(screen.getByText('Professional'))
    const textarea = screen.getByPlaceholderText(/Enter your email draft here/)
    await user.type(textarea, 'Test email content')

    // Enhance email
    fireEvent.click(screen.getByText('Enhance Email'))

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Enhancement Results')).toBeInTheDocument()
    })

    // Check for copy buttons
    const copyButtons = screen.getAllByText('Copy')
    expect(copyButtons.length).toBeGreaterThan(0)
  })
})