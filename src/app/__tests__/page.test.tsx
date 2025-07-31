import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../page'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'

// Mock the ApiKeyGuard component
jest.mock('@/components/ApiKeyStatus', () => ({
  ApiKeyGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-key-guard">{children}</div>
  )
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ApiKeyProvider>
      {component}
    </ApiKeyProvider>
  )
}

describe('Home Page', () => {
  it('renders the main heading and description', () => {
    renderWithProvider(<Home />)
    
    expect(screen.getByText('Welcome to Email Template Generator')).toBeInTheDocument()
    expect(screen.getByText(/Transform your emails with AI-powered templates/)).toBeInTheDocument()
  })

  it('renders feature cards with correct links', () => {
    renderWithProvider(<Home />)
    
    // Template Enhancer card
    const templateCard = screen.getByRole('link', { name: /template enhancer/i })
    expect(templateCard).toHaveAttribute('href', '/template-enhancer')
    expect(screen.getByText('Template Enhancer')).toBeInTheDocument()
    expect(screen.getByText(/Choose from six professional templates/)).toBeInTheDocument()
    
    // AI Trainer card
    const trainerCard = screen.getByRole('link', { name: /ai trainer/i })
    expect(trainerCard).toHaveAttribute('href', '/trainer')
    expect(screen.getByText('AI Trainer')).toBeInTheDocument()
    expect(screen.getByText(/Train the AI with your input\/output examples/)).toBeInTheDocument()
  })

  it('renders getting started guide', () => {
    renderWithProvider(<Home />)
    
    expect(screen.getByText('🚀 Getting Started')).toBeInTheDocument()
    expect(screen.getByText('1. Add API Key')).toBeInTheDocument()
    expect(screen.getByText('2. Choose Feature')).toBeInTheDocument()
    expect(screen.getByText('3. Generate')).toBeInTheDocument()
  })

  it('renders feature highlights', () => {
    renderWithProvider(<Home />)
    
    expect(screen.getByText('Modern Design')).toBeInTheDocument()
    expect(screen.getByText('Secure & Private')).toBeInTheDocument()
    expect(screen.getByText('Fast & Reliable')).toBeInTheDocument()
    
    expect(screen.getByText(/Apple-inspired glass morphism interface/)).toBeInTheDocument()
    expect(screen.getByText(/Client-side API key storage/)).toBeInTheDocument()
    expect(screen.getByText(/Powered by Google Gemini AI/)).toBeInTheDocument()
  })

  it('has proper semantic structure', () => {
    renderWithProvider(<Home />)
    
    // Check for proper heading hierarchy
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Welcome to Email Template Generator')
    
    const h2Elements = screen.getAllByRole('heading', { level: 2 })
    expect(h2Elements).toHaveLength(2) // Template Enhancer and AI Trainer
    
    const h3Elements = screen.getAllByRole('heading', { level: 3 })
    expect(h3Elements.length).toBeGreaterThan(0) // Getting started and feature highlights
  })

  it('applies responsive classes correctly', () => {
    renderWithProvider(<Home />)
    
    const container = screen.getByTestId('api-key-guard').firstChild
    expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-8', 'md:py-12')
  })

  it('includes proper call-to-action buttons', () => {
    renderWithProvider(<Home />)
    
    const getStartedButton = screen.getByText('Get Started →')
    const tryTrainerButton = screen.getByText('Try Trainer →')
    
    expect(getStartedButton).toBeInTheDocument()
    expect(tryTrainerButton).toBeInTheDocument()
  })

  it('wraps content with ApiKeyGuard', () => {
    renderWithProvider(<Home />)
    
    expect(screen.getByTestId('api-key-guard')).toBeInTheDocument()
  })
})