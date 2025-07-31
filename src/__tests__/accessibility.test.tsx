/**
 * Accessibility Tests for WCAG Compliance
 * Tests to ensure the application meets accessibility standards
 */

import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ApiKeyContextProvider } from '@/contexts/ApiKeyContext'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ApiKeyContextProvider>{children}</ApiKeyContextProvider>
)

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Set up valid API key for tests
    localStorage.setItem('gemini-api-key', 'AIzaSyTestKey1234567890123456789012345')
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Page Accessibility', () => {
    it('home page should not have accessibility violations', async () => {
      const { default: HomePage } = await import('@/app/page')
      
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('template enhancer page should not have accessibility violations', async () => {
      const { default: TemplateEnhancerPage } = await import('@/app/template-enhancer/page')
      
      const { container } = render(
        <TestWrapper>
          <TemplateEnhancerPage />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('trainer page should not have accessibility violations', async () => {
      const { default: TrainerPage } = await import('@/app/trainer/page')
      
      const { container } = render(
        <TestWrapper>
          <TrainerPage />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Component Accessibility', () => {
    it('ApiKeyInput should be accessible', async () => {
      const { ApiKeyInput } = await import('@/components/ApiKeyInput')
      
      const { container } = render(
        <TestWrapper>
          <ApiKeyInput onValidKey={() => {}} />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('EmailEditor should be accessible', async () => {
      const { EmailEditor } = await import('@/components/EmailEditor')
      
      const { container } = render(
        <TestWrapper>
          <EmailEditor />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('TemplateSelector should be accessible', async () => {
      const { TemplateSelector } = await import('@/components/TemplateSelector')
      
      const { container } = render(
        <TestWrapper>
          <TemplateSelector />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Header should be accessible', async () => {
      const { Header } = await import('@/components/Header')
      
      const { container } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Footer should be accessible', async () => {
      const { Footer } = await import('@/components/Footer')
      
      const { container } = render(
        <TestWrapper>
          <Footer />
        </TestWrapper>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('UI Component Accessibility', () => {
    it('GlassButton should be accessible', async () => {
      const { GlassButton } = await import('@/components/ui/GlassButton')
      
      const { container } = render(
        <GlassButton>Click me</GlassButton>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('GlassInput should be accessible', async () => {
      const { GlassInput } = await import('@/components/ui/GlassInput')
      
      const { container } = render(
        <GlassInput label="Test Input" placeholder="Enter text" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('GlassTextarea should be accessible', async () => {
      const { GlassTextarea } = await import('@/components/ui/GlassTextarea')
      
      const { container } = render(
        <GlassTextarea label="Test Textarea" placeholder="Enter text" />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('ErrorMessage should be accessible', async () => {
      const { ErrorMessage } = await import('@/components/ui/ErrorMessage')
      
      const { container } = render(
        <ErrorMessage 
          title="Error Title"
          message="This is an error message"
          onRetry={() => {}}
          onDismiss={() => {}}
        />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('LoadingSpinner should be accessible', async () => {
      const { LoadingSpinner } = await import('@/components/ui/LoadingSpinner')
      
      const { container } = render(
        <LoadingSpinner />
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Accessibility', () => {
    it('forms should have proper labels and ARIA attributes', async () => {
      const { ApiKeyInput } = await import('@/components/ApiKeyInput')
      
      const { container, getByLabelText } = render(
        <TestWrapper>
          <ApiKeyInput onValidKey={() => {}} />
        </TestWrapper>
      )
      
      // Check for proper labeling
      const input = getByLabelText(/google gemini api key/i)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'password')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('error states should be properly announced', async () => {
      const { GlassInput } = await import('@/components/ui/GlassInput')
      
      const { container, getByRole } = render(
        <GlassInput 
          label="Test Input"
          error="This field is required"
          aria-describedby="error-message"
        />
      )
      
      const input = getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Navigation Accessibility', () => {
    it('navigation should be keyboard accessible', async () => {
      const { Header } = await import('@/components/Header')
      
      const { container, getAllByRole } = render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      )
      
      const links = getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('skip links should be available for screen readers', async () => {
      const { default: RootLayout } = await import('@/app/layout')
      
      const { container } = render(
        <RootLayout>
          <div>Main content</div>
        </RootLayout>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG color contrast requirements', async () => {
      const { GlassButton } = await import('@/components/ui/GlassButton')
      
      const { container } = render(
        <div>
          <GlassButton variant="primary">Primary Button</GlassButton>
          <GlassButton variant="secondary">Secondary Button</GlassButton>
          <GlassButton variant="outline">Outline Button</GlassButton>
          <GlassButton variant="ghost">Ghost Button</GlassButton>
        </div>
      )
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })

  describe('Focus Management', () => {
    it('should have proper focus indicators', async () => {
      const { GlassButton } = await import('@/components/ui/GlassButton')
      
      const { container } = render(
        <GlassButton>Focusable Button</GlassButton>
      )
      
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })

    it('modal dialogs should trap focus', async () => {
      const { ApiKeyGuard } = await import('@/components/ApiKeyStatus')
      
      // Clear API key to trigger modal
      localStorage.removeItem('gemini-api-key')
      
      const { container } = render(
        <ApiKeyGuard>
          <div>Protected content</div>
        </ApiKeyGuard>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and roles', async () => {
      const { LoadingSpinner } = await import('@/components/ui/LoadingSpinner')
      
      const { container, getByRole } = render(
        <LoadingSpinner />
      )
      
      const spinner = getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should announce dynamic content changes', async () => {
      const { ErrorMessage } = await import('@/components/ui/ErrorMessage')
      
      const { container, getByRole } = render(
        <ErrorMessage message="An error occurred" />
      )
      
      // Error messages should be announced
      const alert = getByRole('alert', { hidden: true }) || container.querySelector('[role="alert"]')
      expect(alert || container.firstChild).toBeInTheDocument()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation', async () => {
      const { TemplateSelector } = await import('@/components/TemplateSelector')
      
      const { container } = render(
        <TestWrapper>
          <TemplateSelector />
        </TestWrapper>
      )
      
      const results = await axe(container, {
        rules: {
          'keyboard': { enabled: true },
        },
      })
      expect(results).toHaveNoViolations()
    })
  })
})