import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Header } from '../Header'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock components
jest.mock('../ApiKeyStatus', () => ({
  ApiKeyStatus: () => <div data-testid="api-key-status">API Key Status</div>
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ApiKeyProvider>
      {component}
    </ApiKeyProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders the header with logo and title', () => {
    renderWithProvider(<Header />)
    
    expect(screen.getByText('Email Template Generator')).toBeInTheDocument()
    expect(screen.getByText('📧')).toBeInTheDocument()
    expect(screen.getByText('AI-powered email enhancement')).toBeInTheDocument()
  })

  it('renders navigation links on desktop', () => {
    renderWithProvider(<Header />)
    
    const templateLink = screen.getByRole('link', { name: /template enhancer/i })
    const trainerLink = screen.getByRole('link', { name: /ai trainer/i })
    
    expect(templateLink).toBeInTheDocument()
    expect(trainerLink).toBeInTheDocument()
    expect(templateLink).toHaveAttribute('href', '/template-enhancer')
    expect(trainerLink).toHaveAttribute('href', '/trainer')
  })

  it('highlights active navigation link', () => {
    mockUsePathname.mockReturnValue('/template-enhancer')
    renderWithProvider(<Header />)
    
    const templateLink = screen.getByRole('link', { name: /template enhancer/i })
    expect(templateLink).toHaveClass('text-accent-primary')
  })

  it('renders API key status component', () => {
    renderWithProvider(<Header />)
    
    expect(screen.getByTestId('api-key-status')).toBeInTheDocument()
  })

  it('shows mobile menu button on small screens', () => {
    renderWithProvider(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when button is clicked', () => {
    renderWithProvider(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    
    // Mobile menu should not be visible initially
    expect(screen.queryByText('📧 Template Enhancer')).not.toBeInTheDocument()
    
    // Click to open mobile menu
    fireEvent.click(menuButton)
    expect(screen.getByText('📧 Template Enhancer')).toBeInTheDocument()
    expect(screen.getByText('🤖 AI Trainer')).toBeInTheDocument()
    
    // Click to close mobile menu
    fireEvent.click(menuButton)
    expect(screen.queryByText('📧 Template Enhancer')).not.toBeInTheDocument()
  })

  it('closes mobile menu when navigation link is clicked', () => {
    renderWithProvider(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    
    // Open mobile menu
    fireEvent.click(menuButton)
    expect(screen.getByText('📧 Template Enhancer')).toBeInTheDocument()
    
    // Click on mobile navigation link
    const mobileTemplateLink = screen.getByText('📧 Template Enhancer')
    fireEvent.click(mobileTemplateLink)
    
    // Menu should close
    expect(screen.queryByText('📧 Template Enhancer')).not.toBeInTheDocument()
  })

  it('renders shortened title on small screens', () => {
    renderWithProvider(<Header />)
    
    expect(screen.getByText('Email Generator')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    renderWithProvider(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle mobile menu')
    
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })
})