import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlassInput } from '../GlassInput'

describe('GlassInput', () => {
  it('renders basic input correctly', () => {
    render(<GlassInput placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('w-full', 'px-4', 'py-3', 'rounded-lg')
  })

  it('renders with label', () => {
    render(<GlassInput label="Test Label" placeholder="Enter text" />)
    
    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<GlassInput error="This field is required" placeholder="Enter text" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toHaveClass('border-red-400')
  })

  it('renders with right icon', () => {
    const icon = <button data-testid="icon-button">👁️</button>
    render(<GlassInput rightIcon={icon} placeholder="Enter text" />)
    
    expect(screen.getByTestId('icon-button')).toBeInTheDocument()
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toHaveClass('pr-12')
  })

  it('applies different blur levels', () => {
    const { rerender } = render(<GlassInput blur="sm" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('backdrop-blur-sm')
    
    rerender(<GlassInput blur="xl" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('backdrop-blur-xl')
  })

  it('applies different opacity levels', () => {
    const { rerender } = render(<GlassInput opacity="low" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('bg-white/5')
    
    rerender(<GlassInput opacity="high" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveClass('bg-white/20')
  })

  it('handles input changes', () => {
    const handleChange = jest.fn()
    render(<GlassInput onChange={handleChange} placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    fireEvent.change(input, { target: { value: 'test value' } })
    
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<GlassInput disabled placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<GlassInput className="custom-class" data-testid="input" />)
    
    expect(screen.getByTestId('input')).toHaveClass('custom-class')
  })

  it('generates unique id when not provided', () => {
    render(<GlassInput label="Test" />)
    
    const input = screen.getByLabelText('Test')
    expect(input).toHaveAttribute('id')
    expect(input.id).toMatch(/^glass-input-/)
  })

  it('uses provided id', () => {
    render(<GlassInput id="custom-id" label="Test" />)
    
    const input = screen.getByLabelText('Test')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('has proper focus styles', () => {
    render(<GlassInput data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-white/50',
      'focus:border-white/40'
    )
  })
})