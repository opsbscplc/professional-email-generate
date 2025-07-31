import React from 'react'
import { render, screen } from '@testing-library/react'
import RootLayout from '../layout'

// Mock the components
jest.mock('@/components/Header', () => ({
  Header: () => <header data-testid="header">Header</header>
}))

jest.mock('@/components/Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>
}))

jest.mock('@/contexts/ApiKeyContext', () => ({
  ApiKeyProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-key-provider">{children}</div>
  )
}))

describe('RootLayout', () => {
  it('renders the basic layout structure', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  it('wraps content with ApiKeyProvider', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    expect(screen.getByTestId('api-key-provider')).toBeInTheDocument()
  })

  it('applies correct layout classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    const bodyDiv = container.querySelector('div')
    expect(bodyDiv).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-blue-50',
      'via-indigo-50',
      'to-purple-50',
      'flex',
      'flex-col'
    )
  })

  it('has proper semantic structure', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )
    
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main).toHaveClass('flex-1')
    expect(main).toContainElement(screen.getByTestId('test-content'))
  })

  it('sets correct HTML attributes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    const html = container.querySelector('html')
    expect(html).toHaveAttribute('lang', 'en')
  })
})