import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoadingOverlay, InlineLoading, LoadingButton } from '../LoadingOverlay'

describe('LoadingOverlay', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<LoadingOverlay isVisible={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders overlay when visible', () => {
    render(<LoadingOverlay isVisible={true} />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('shows custom message', () => {
    render(<LoadingOverlay isVisible={true} message="Custom loading message" />)
    
    expect(screen.getByText('Custom loading message')).toBeInTheDocument()
  })

  it('shows progress bar when progress provided', () => {
    render(<LoadingOverlay isVisible={true} progress={50} />)
    
    expect(screen.getByText('50%')).toBeInTheDocument()
    
    const progressBar = screen.getByRole('progressbar', { hidden: true })
    expect(progressBar).toHaveStyle('width: 50%')
  })

  it('shows cancel button when onCancel provided', () => {
    const onCancel = jest.fn()
    render(<LoadingOverlay isVisible={true} onCancel={onCancel} />)
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(onCancel).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <LoadingOverlay isVisible={true} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles progress bounds correctly', () => {
    const { rerender } = render(<LoadingOverlay isVisible={true} progress={-10} />)
    expect(screen.getByRole('progressbar', { hidden: true })).toHaveStyle('width: 0%')
    
    rerender(<LoadingOverlay isVisible={true} progress={150} />)
    expect(screen.getByRole('progressbar', { hidden: true })).toHaveStyle('width: 100%')
  })
})

describe('InlineLoading', () => {
  it('renders loading spinner', () => {
    render(<InlineLoading />)
    
    // Check for spinner element (div with animation classes)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows message when provided', () => {
    render(<InlineLoading message="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies different sizes', () => {
    const { rerender } = render(<InlineLoading size="sm" />)
    let spinner = document.querySelector('.w-4.h-4')
    expect(spinner).toBeInTheDocument()
    
    rerender(<InlineLoading size="md" />)
    spinner = document.querySelector('.w-6.h-6')
    expect(spinner).toBeInTheDocument()
    
    rerender(<InlineLoading size="lg" />)
    spinner = document.querySelector('.w-8.h-8')
    expect(spinner).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<InlineLoading className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingButton isLoading={false}>
        Click me
      </LoadingButton>
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading state when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    
    // Children should be hidden
    const children = screen.getByText('Click me')
    expect(children).toHaveClass('opacity-0')
    
    // Loading spinner should be visible
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('shows loading text when provided', () => {
    render(
      <LoadingButton isLoading={true} loadingText="Saving...">
        Save
      </LoadingButton>
    )
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('calls onClick when clicked and not disabled', () => {
    const onClick = jest.fn()
    
    render(
      <LoadingButton isLoading={false} onClick={onClick}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClick).toHaveBeenCalled()
  })

  it('does not call onClick when loading', () => {
    const onClick = jest.fn()
    
    render(
      <LoadingButton isLoading={true} onClick={onClick}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is disabled when loading', () => {
    render(
      <LoadingButton isLoading={true}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <LoadingButton isLoading={false} disabled={true}>
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies different variants', () => {
    const { rerender } = render(
      <LoadingButton isLoading={false} variant="primary">
        Primary
      </LoadingButton>
    )
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-r', 'from-blue-500', 'to-purple-500')
    
    rerender(
      <LoadingButton isLoading={false} variant="secondary">
        Secondary
      </LoadingButton>
    )
    
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100')
    
    rerender(
      <LoadingButton isLoading={false} variant="outline">
        Outline
      </LoadingButton>
    )
    
    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300')
  })

  it('applies custom className', () => {
    render(
      <LoadingButton isLoading={false} className="custom-class">
        Click me
      </LoadingButton>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})