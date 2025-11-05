import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorMessage, ErrorBoundary } from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message with default variant', () => {
    render(<ErrorMessage message="Something went wrong" />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('❌')).toBeInTheDocument()
  })

  it('renders with title when provided', () => {
    render(<ErrorMessage title="Error Title" message="Error message" />)
    
    expect(screen.getByText('Error Title')).toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('renders warning variant correctly', () => {
    render(<ErrorMessage variant="warning" message="Warning message" />)
    
    expect(screen.getByText('⚠️')).toBeInTheDocument()
    expect(screen.getByText('Warning message')).toBeInTheDocument()
  })

  it('renders info variant correctly', () => {
    render(<ErrorMessage variant="info" message="Info message" />)
    
    expect(screen.getByText('ℹ️')).toBeInTheDocument()
    expect(screen.getByText('Info message')).toBeInTheDocument()
  })

  it('shows retry button when onRetry is provided', () => {
    const mockRetry = jest.fn()
    render(<ErrorMessage message="Error" onRetry={mockRetry} />)
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('shows dismiss button when onDismiss is provided', () => {
    const mockDismiss = jest.fn()
    render(<ErrorMessage message="Error" onDismiss={mockDismiss} />)
    
    const dismissButton = screen.getByText('Dismiss')
    expect(dismissButton).toBeInTheDocument()
    
    fireEvent.click(dismissButton)
    expect(mockDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows both retry and dismiss buttons when both callbacks provided', () => {
    const mockRetry = jest.fn()
    const mockDismiss = jest.fn()
    render(
      <ErrorMessage 
        message="Error" 
        onRetry={mockRetry} 
        onDismiss={mockDismiss} 
      />
    )
    
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Dismiss')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ErrorMessage message="Error" className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies correct styling for error variant', () => {
    const { container } = render(
      <ErrorMessage variant="error" message="Error message" />
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-red-400/50')
    expect(card).toHaveClass('bg-red-500/10')
  })

  it('applies correct styling for warning variant', () => {
    const { container } = render(
      <ErrorMessage variant="warning" message="Warning message" />
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-yellow-400/50')
    expect(card).toHaveClass('bg-yellow-500/10')
  })

  it('applies correct styling for info variant', () => {
    const { container } = render(
      <ErrorMessage variant="info" message="Info message" />
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('border-blue-400/50')
    expect(card).toHaveClass('bg-blue-500/10')
  })
})

describe('ErrorBoundary', () => {
  // Mock console.error to avoid noise in tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('renders error message when error event occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    
    // Simulate an error event
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error message',
      filename: 'test.js',
      lineno: 1,
      colno: 1,
    })
    
    window.dispatchEvent(errorEvent)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    
    // Simulate an error
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
    })
    
    window.dispatchEvent(errorEvent)
    
    expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
  })

  it('handles unhandled promise rejection', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    
    // Simulate unhandled promise rejection
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject('Promise error'),
      reason: 'Promise error',
    })
    
    window.dispatchEvent(rejectionEvent)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Promise error')).toBeInTheDocument()
  })

  it('can recover from error state', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    
    // Trigger error
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
    })
    window.dispatchEvent(errorEvent)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // Click retry button
    fireEvent.click(screen.getByText('Try Again'))
    
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })
})