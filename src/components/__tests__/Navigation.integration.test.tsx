import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

// Mock ApiKeyStatus component
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

describe('Navigation Integration', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders consistent navigation links in header and footer', () => {
    const { rerender } = renderWithProvider(<Header />)
    
    // Check header navigation
    expect(screen.getByRole('link', { name: /template enhancer/i })).toHaveAttribute('href', '/template-enhancer')
    expect(screen.getByRole('link', { name: /ai trainer/i })).toHaveAttribute('href', '/trainer')
    
    // Switch to footer
    rerender(<Footer />)
    
    // Check footer navigation
    expect(screen.getByRole('link', { name: /template enhancer/i })).toHaveAttribute('href', '/template-enhancer')
    expect(screen.getByRole('link', { name: /ai trainer/i })).toHaveAttribute('href', '/trainer')
  })

  it('highlights active page in header navigation', () => {
    mockUsePathname.mockReturnValue('/template-enhancer')
    renderWithProvider(<Header />)
    
    const templateLink = screen.getByRole('link', { name: /template enhancer/i })
    const trainerLink = screen.getByRole('link', { name: /ai trainer/i })
    
    expect(templateLink).toHaveClass('text-accent-primary')
    expect(trainerLink).not.toHaveClass('text-accent-primary')
  })

  it('provides mobile-friendly navigation', () => {
    renderWithProvider(<Header />)
    
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    
    // Open mobile menu
    fireEvent.click(menuButton)
    
    // Check mobile navigation links
    const mobileTemplateLink = screen.getByText('📧 Template Enhancer')
    const mobileTrainerLink = screen.getByText('🤖 AI Trainer')
    
    expect(mobileTemplateLink.closest('a')).toHaveAttribute('href', '/template-enhancer')
    expect(mobileTrainerLink.closest('a')).toHaveAttribute('href', '/trainer')
  })

  it('maintains accessibility standards', () => {
    renderWithProvider(<Header />)
    
    // Check for proper ARIA labels
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    expect(menuButton).toHaveAttribute('aria-label')
    
    // Check for proper navigation landmarks
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
  })

  it('handles responsive design correctly', () => {
    renderWithProvider(<Header />)
    
    // Desktop navigation should be hidden on mobile
    const desktopNav = screen.getByRole('navigation')
    expect(desktopNav).toHaveClass('hidden', 'md:flex')
    
    // Mobile menu button should be hidden on desktop
    const menuButton = screen.getByRole('button', { name: /toggle mobile menu/i })
    expect(menuButton).toHaveClass('md:hidden')
  })
})