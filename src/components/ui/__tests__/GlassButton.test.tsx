import { render, screen, fireEvent } from '@testing-library/react'
import { GlassButton } from '../GlassButton'

describe('GlassButton', () => {
  it('renders children correctly', () => {
    render(<GlassButton>Click me</GlassButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies correct variant classes', () => {
    const { container } = render(
      <GlassButton variant="primary">Primary Button</GlassButton>
    )
    expect(container.firstChild).toHaveClass('bg-accent-primary/80')
  })

  it('applies correct size classes', () => {
    const { container } = render(
      <GlassButton size="lg">Large Button</GlassButton>
    )
    expect(container.firstChild).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('shows loading state correctly', () => {
    render(<GlassButton loading>Loading Button</GlassButton>)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Loading Button')).not.toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<GlassButton onClick={handleClick}>Clickable</GlassButton>)
    
    fireEvent.click(screen.getByText('Clickable'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<GlassButton loading>Loading</GlassButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<GlassButton disabled>Disabled</GlassButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <GlassButton className="custom-class">Custom</GlassButton>
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})