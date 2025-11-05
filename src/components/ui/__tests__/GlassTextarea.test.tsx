import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { GlassTextarea } from '../GlassTextarea'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'

describe('GlassTextarea', () => {
  it('renders textarea with basic props', () => {
    render(<GlassTextarea placeholder="Enter text" />)
    
    const textarea = screen.getByPlaceholderText('Enter text')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('renders with label', () => {
    render(<GlassTextarea label="Description" placeholder="Enter description" />)
    
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('displays error message when error prop is provided', () => {
    render(<GlassTextarea error="This field is required" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error styling when error is present', () => {
    render(<GlassTextarea error="Error message" />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('border-red-400/50')
    expect(textarea).toHaveClass('focus:border-red-400/70')
    expect(textarea).toHaveClass('focus:ring-red-400/20')
  })

  it('shows character count when showCount is true', () => {
    render(<GlassTextarea showCount value="Hello" onChange={() => {}} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows character count with max length', () => {
    render(
      <GlassTextarea 
        showCount 
        maxLength={100} 
        value="Hello world" 
        onChange={() => {}} 
      />
    )
    
    expect(screen.getByText('11/100')).toBeInTheDocument()
  })

  it('updates character count on input change', () => {
    const mockOnChange = jest.fn()
    render(
      <GlassTextarea 
        showCount 
        value="" 
        onChange={mockOnChange} 
      />
    )
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'New text' } })
    
    expect(mockOnChange).toHaveBeenCalled()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('respects maxLength prop', () => {
    render(<GlassTextarea maxLength={10} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('maxLength', '10')
  })

  it('applies custom className', () => {
    render(<GlassTextarea className="custom-class" />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<GlassTextarea ref={ref} />)
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('handles disabled state', () => {
    render(<GlassTextarea disabled />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:opacity-50')
    expect(textarea).toHaveClass('disabled:cursor-not-allowed')
  })

  it('has proper glass effect styling', () => {
    render(<GlassTextarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('backdrop-blur-md')
    expect(textarea).toHaveClass('bg-white/10')
    expect(textarea).toHaveClass('border-white/30')
  })

  it('has proper focus styling', () => {
    render(<GlassTextarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('focus:bg-white/20')
    expect(textarea).toHaveClass('focus:border-white/50')
    expect(textarea).toHaveClass('focus:outline-none')
    expect(textarea).toHaveClass('focus:ring-2')
    expect(textarea).toHaveClass('focus:ring-white/20')
  })

  it('has minimum height styling', () => {
    render(<GlassTextarea />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('min-h-[100px]')
  })

  it('passes through additional props', () => {
    render(<GlassTextarea data-testid="custom-textarea" rows={5} />)
    
    const textarea = screen.getByTestId('custom-textarea')
    expect(textarea).toHaveAttribute('rows', '5')
  })
})