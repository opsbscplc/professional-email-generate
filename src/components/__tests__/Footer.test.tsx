import { render, screen } from '@testing-library/react'
import { Footer } from '../Footer'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('Footer', () => {
  it('renders footer with brand information', () => {
    render(<Footer />)
    
    expect(screen.getByText('📧')).toBeInTheDocument()
    expect(screen.getByText('Email Template Generator')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Footer />)
    
    const templateEnhancerLink = screen.getByRole('link', { name: 'Template Enhancer' })
    const trainerLink = screen.getByRole('link', { name: 'AI Trainer' })
    
    expect(templateEnhancerLink).toBeInTheDocument()
    expect(templateEnhancerLink).toHaveAttribute('href', '/template-enhancer')
    
    expect(trainerLink).toBeInTheDocument()
    expect(trainerLink).toHaveAttribute('href', '/trainer')
  })

  it('renders attribution information', () => {
    render(<Footer />)
    
    expect(screen.getByText('Powered by Google Gemini AI')).toBeInTheDocument()
    expect(screen.getByText('Built with Next.js & Tailwind CSS')).toBeInTheDocument()
  })

  it('has proper responsive layout classes', () => {
    const { container } = render(<Footer />)
    
    const footerContent = container.querySelector('.flex.flex-col.md\\:flex-row')
    expect(footerContent).toBeInTheDocument()
  })

  it('applies glass card styling', () => {
    const { container } = render(<Footer />)
    
    // Check that GlassCard component is used (it should have backdrop-blur classes)
    const glassCard = container.querySelector('[class*="backdrop-blur"]')
    expect(glassCard).toBeInTheDocument()
  })
})