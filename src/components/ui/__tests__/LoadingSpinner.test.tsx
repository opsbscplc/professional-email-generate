import { render, screen } from '@testing-library/react'
import { LoadingSpinner, LoadingOverlay } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without text', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    const spinner = container.querySelector('.w-8')
    expect(spinner).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-spinner" />)
    expect(container.firstChild).toHaveClass('custom-spinner')
  })
})

describe('LoadingOverlay', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingOverlay loading={false}>
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('shows loading overlay when loading', () => {
    render(
      <LoadingOverlay loading={true} text="Processing...">
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('renders without loading text', () => {
    render(
      <LoadingOverlay loading={true}>
        <div>Content</div>
      </LoadingOverlay>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
    // Should still show spinner even without text
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})