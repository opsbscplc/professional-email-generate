import React from 'react'
import { render, screen } from '@testing-library/react'
import TrainerPage from '../page'
import { ApiKeyContext } from '@/contexts/ApiKeyContext'
import { ApiKeyContextType } from '@/types'

// Mock the TrainerInterface component
jest.mock('@/components/TrainerInterface', () => ({
  TrainerInterface: ({ className }: { className?: string }) => (
    <div data-testid="trainer-interface" className={className}>
      Mocked TrainerInterface
    </div>
  )
}))

const mockApiKeyContext: ApiKeyContextType = {
  apiKey: 'test-api-key',
  setApiKey: jest.fn(),
  clearApiKey: jest.fn(),
  isValid: true
}

const renderWithApiKey = (component: React.ReactElement) => {
  return render(
    <ApiKeyContext.Provider value={mockApiKeyContext}>
      {component}
    </ApiKeyContext.Provider>
  )
}

describe('TrainerPage', () => {
  it('renders the page title and description', () => {
    renderWithApiKey(<TrainerPage />)
    
    expect(screen.getByText('AI Email Trainer')).toBeInTheDocument()
    expect(screen.getByText(/Train the AI with your communication style/)).toBeInTheDocument()
  })

  it('renders the TrainerInterface component', () => {
    renderWithApiKey(<TrainerPage />)
    
    expect(screen.getByTestId('trainer-interface')).toBeInTheDocument()
  })

  it('has proper page structure with container and spacing', () => {
    renderWithApiKey(<TrainerPage />)
    
    const container = screen.getByText('AI Email Trainer').closest('.container')
    expect(container).toHaveClass('mx-auto', 'px-4', 'py-8', 'max-w-6xl')
  })

  it('centers the title and description', () => {
    renderWithApiKey(<TrainerPage />)
    
    const titleSection = screen.getByText('AI Email Trainer').closest('.text-center')
    expect(titleSection).toBeInTheDocument()
  })

  it('has responsive description text', () => {
    renderWithApiKey(<TrainerPage />)
    
    const description = screen.getByText(/Train the AI with your communication style/)
    expect(description).toHaveClass('max-w-2xl', 'mx-auto')
  })
})