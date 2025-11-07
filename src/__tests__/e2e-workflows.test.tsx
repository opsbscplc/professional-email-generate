/**
 * End-to-End Workflow Tests
 * Tests complete user workflows from start to finish
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyContextProvider } from '@/contexts/ApiKeyContext'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Gemini API
const mockGeminiResponse = {
  success: true,
  data: 'Enhanced email content here...',
}

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockGeminiResponse),
  })
) as jest.Mock

// Test wrapper with context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiKeyContextProvider>{children}</ApiKeyContextProvider>
)

describe('End-to-End User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('Complete Email Template Enhancement Workflow', () => {
    it('allows user to set API key, select template, and enhance email', async () => {
      const user = userEvent.setup()
      
      // Import components dynamically to avoid module loading issues
      const { default: HomePage } = await import('@/app/page')
      const { default: TemplateEnhancerPage } = await import('@/app/template-enhancer/page')
      
      // Step 1: User starts without API key
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      )
      
      expect(screen.getByText('API Key Required')).toBeInTheDocument()
      
      // Step 2: User enters API key
      const apiKeyInput = screen.getByPlaceholderText(/enter your google gemini api key/i)
      await user.type(apiKeyInput, 'AIzaSyTestKey1234567890123456789012345')
      
      const validateButton = screen.getByText('Validate & Save')
      await user.click(validateButton)
      
      await waitFor(() => {
        expect(screen.queryByText('API Key Required')).not.toBeInTheDocument()
      })
      
      // Step 3: Navigate to template enhancer
      render(
        <TestWrapper>
          <TemplateEnhancerPage />
        </TestWrapper>
      )
      
      // Step 4: Select email template
      const professionalTemplate = screen.getByText('Professional')
      await user.click(professionalTemplate)
      
      // Step 5: Enter draft email
      const emailInput = screen.getByPlaceholderText(/write your draft email/i)
      await user.type(emailInput, 'Hi, I wanted to follow up on our meeting yesterday.')
      
      // Step 6: Enhance email
      const enhanceButton = screen.getByText('Enhance Email')
      await user.click(enhanceButton)
      
      // Step 7: Verify enhancement result
      await waitFor(() => {
        expect(screen.getByText('Enhanced email content here...')).toBeInTheDocument()
      })
      
      // Verify API was called correctly
      expect(fetch).toHaveBeenCalledWith('/api/gemini', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('professional'),
      }))
    })
  })

  describe('AI Trainer Workflow', () => {
    it('allows user to train AI with examples and test results', async () => {
      const user = userEvent.setup()
      
      // Set up API key first
      localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      
      const { default: TrainerPage } = await import('@/app/trainer/page')
      
      render(
        <TestWrapper>
          <TrainerPage />
        </TestWrapper>
      )
      
      // Step 1: Enter training input
      const trainingInput = screen.getByPlaceholderText(/enter example input/i)
      await user.type(trainingInput, 'Casual email to friend')
      
      // Step 2: Enter expected output
      const trainingOutput = screen.getByPlaceholderText(/enter expected output/i)
      await user.type(trainingOutput, 'Hey buddy! Hope you\'re doing well...')
      
      // Step 3: Train the AI
      const trainButton = screen.getByText('Train AI')
      await user.click(trainButton)
      
      await waitFor(() => {
        expect(screen.getByText(/training completed/i)).toBeInTheDocument()
      })
      
      // Step 4: Test with new input
      const testInput = screen.getByPlaceholderText(/enter test input/i)
      await user.type(testInput, 'Another casual message')
      
      // Step 5: Generate test output
      const testButton = screen.getByText('Test AI')
      await user.click(testButton)
      
      await waitFor(() => {
        expect(screen.getByText('Enhanced email content here...')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Workflow', () => {
    it('handles API errors gracefully throughout the workflow', async () => {
      const user = userEvent.setup()
      
      // Mock API error
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
      
      localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      
      const { default: TemplateEnhancerPage } = await import('@/app/template-enhancer/page')
      
      render(
        <TestWrapper>
          <TemplateEnhancerPage />
        </TestWrapper>
      )
      
      // Select template and enter email
      const professionalTemplate = screen.getByText('Professional')
      await user.click(professionalTemplate)
      
      const emailInput = screen.getByPlaceholderText(/write your draft email/i)
      await user.type(emailInput, 'Test email content')
      
      // Try to enhance - should show error
      const enhanceButton = screen.getByText('Enhance Email')
      await user.click(enhanceButton)
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
      
      // User can retry
      const retryButton = screen.getByText('Try Again')
      
      // Mock successful response for retry
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeminiResponse),
      })
      
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByText('Enhanced email content here...')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Workflow', () => {
    it('allows seamless navigation between pages', async () => {
      const user = userEvent.setup()
      
      // Set up API key
      localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      
      const { default: HomePage } = await import('@/app/page')
      
      render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      )
      
      // Navigate to template enhancer
      const templateEnhancerLink = screen.getByText('Template Enhancer')
      await user.click(templateEnhancerLink)
      
      // Should show template enhancer page
      expect(screen.getByText('Select Email Template')).toBeInTheDocument()
      
      // Navigate to trainer
      const trainerLink = screen.getByText('AI Trainer')
      await user.click(trainerLink)
      
      // Should show trainer page
      expect(screen.getByText('Train the AI')).toBeInTheDocument()
    })
  })

  describe('Responsive Design Workflow', () => {
    it('works correctly on mobile viewport', async () => {
      const user = userEvent.setup()
      
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      
      const { default: TemplateEnhancerPage } = await import('@/app/template-enhancer/page')
      
      render(
        <TestWrapper>
          <TemplateEnhancerPage />
        </TestWrapper>
      )
      
      // Should still be functional on mobile
      const professionalTemplate = screen.getByText('Professional')
      await user.click(professionalTemplate)
      
      expect(professionalTemplate).toHaveClass('bg-white/20')
    })
  })

  describe('Performance Workflow', () => {
    it('handles large email content efficiently', async () => {
      const user = userEvent.setup()
      
      localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
      
      const { default: TemplateEnhancerPage } = await import('@/app/template-enhancer/page')
      
      render(
        <TestWrapper>
          <TemplateEnhancerPage />
        </TestWrapper>
      )
      
      // Create large email content
      const largeContent = 'This is a very long email content. '.repeat(100)
      
      const professionalTemplate = screen.getByText('Professional')
      await user.click(professionalTemplate)
      
      const emailInput = screen.getByPlaceholderText(/write your draft email/i)
      await user.type(emailInput, largeContent)
      
      // Should handle large content without issues
      expect(emailInput).toHaveValue(largeContent)
      
      const enhanceButton = screen.getByText('Enhance Email')
      await user.click(enhanceButton)
      
      // Should still process successfully
      await waitFor(() => {
        expect(screen.getByText('Enhanced email content here...')).toBeInTheDocument()
      })
    })
  })
})