import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EmailEditor, EmailComparison } from '../EmailEditor'

// Mock the clipboard API
const mockWriteText = jest.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

describe('EmailEditor', () => {
  const mockOnChange = jest.fn()
  const mockOnCopy = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnCopy.mockClear()
    mockWriteText.mockClear()
  })

  it('renders with default props', () => {
    render(<EmailEditor value="" onChange={mockOnChange} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('placeholder', 'Enter your email draft here...')
  })

  it('displays custom placeholder', () => {
    render(
      <EmailEditor
        value=""
        onChange={mockOnChange}
        placeholder="Custom placeholder"
      />
    )
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })

  it('calls onChange when text is entered', () => {
    render(<EmailEditor value="" onChange={mockOnChange} />)
    
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello world' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('Hello world')
  })

  it('displays character count', () => {
    render(<EmailEditor value="Hello" onChange={mockOnChange} />)
    
    expect(screen.getByText('5/5,000')).toBeInTheDocument()
  })

  it('shows warning when near character limit', () => {
    const longText = 'a'.repeat(4100) // 82% of 5000
    render(<EmailEditor value={longText} onChange={mockOnChange} />)
    
    const characterCount = screen.getByText('4,100/5,000')
    expect(characterCount).toHaveClass('text-yellow-400')
  })

  it('shows error when over character limit', () => {
    const longText = 'a'.repeat(5100)
    render(<EmailEditor value={longText} onChange={mockOnChange} />)
    
    const characterCount = screen.getByText('5,100/5,000')
    expect(characterCount).toHaveClass('text-red-400')
    expect(screen.getByText('Limit exceeded')).toBeInTheDocument()
  })

  it('displays label when provided', () => {
    render(
      <EmailEditor
        value=""
        onChange={mockOnChange}
        label="Email Draft"
      />
    )
    
    expect(screen.getByText('Email Draft')).toBeInTheDocument()
  })

  it('shows copy button when showCopyButton is true and has content', () => {
    render(
      <EmailEditor
        value="Some content"
        onChange={mockOnChange}
        showCopyButton={true}
        label="Test"
      />
    )
    
    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('does not show copy button when content is empty', () => {
    render(
      <EmailEditor
        value=""
        onChange={mockOnChange}
        showCopyButton={true}
        label="Test"
      />
    )
    
    expect(screen.queryByText('Copy')).not.toBeInTheDocument()
  })

  it('copies content to clipboard when copy button is clicked', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    render(
      <EmailEditor
        value="Test content"
        onChange={mockOnChange}
        showCopyButton={true}
        onCopy={mockOnCopy}
        label="Test"
      />
    )
    
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Test content')
      expect(mockOnCopy).toHaveBeenCalled()
    })
    
    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('shows error when copy fails', async () => {
    mockWriteText.mockRejectedValue(new Error('Copy failed'))
    
    render(
      <EmailEditor
        value="Test content"
        onChange={mockOnChange}
        showCopyButton={true}
        label="Test"
      />
    )
    
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to copy to clipboard')).toBeInTheDocument()
    })
  })

  it('is read-only when readOnly prop is true', () => {
    render(
      <EmailEditor
        value="Read only content"
        readOnly={true}
      />
    )
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('readonly')
    expect(textarea).toHaveClass('cursor-default')
  })

  it('respects custom maxLength', () => {
    render(
      <EmailEditor
        value="test"
        onChange={mockOnChange}
        maxLength={100}
      />
    )
    
    expect(screen.getByText('4/100')).toBeInTheDocument()
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('maxlength', '100')
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmailEditor
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('EmailComparison', () => {
  const mockOnCopyOriginal = jest.fn()
  const mockOnCopyEnhanced = jest.fn()

  beforeEach(() => {
    mockOnCopyOriginal.mockClear()
    mockOnCopyEnhanced.mockClear()
  })

  it('renders both original and enhanced emails', () => {
    render(
      <EmailComparison
        originalEmail="Original email content"
        enhancedEmail="Enhanced email content"
        onCopyOriginal={mockOnCopyOriginal}
        onCopyEnhanced={mockOnCopyEnhanced}
      />
    )
    
    expect(screen.getByDisplayValue('Original email content')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Enhanced email content')).toBeInTheDocument()
    expect(screen.getByText('Original Draft')).toBeInTheDocument()
    expect(screen.getByText('Enhanced Email')).toBeInTheDocument()
  })

  it('shows copy buttons for both emails', () => {
    render(
      <EmailComparison
        originalEmail="Original email content"
        enhancedEmail="Enhanced email content"
        onCopyOriginal={mockOnCopyOriginal}
        onCopyEnhanced={mockOnCopyEnhanced}
      />
    )
    
    const copyButtons = screen.getAllByText('Copy')
    expect(copyButtons).toHaveLength(2)
  })

  it('calls appropriate callback when copy buttons are clicked', async () => {
    mockWriteText.mockResolvedValue(undefined)
    
    render(
      <EmailComparison
        originalEmail="Original email content"
        enhancedEmail="Enhanced email content"
        onCopyOriginal={mockOnCopyOriginal}
        onCopyEnhanced={mockOnCopyEnhanced}
      />
    )
    
    const copyButtons = screen.getAllByText('Copy')
    
    // Click first copy button (original)
    fireEvent.click(copyButtons[0])
    await waitFor(() => {
      expect(mockOnCopyOriginal).toHaveBeenCalled()
    })
    
    // Click second copy button (enhanced)
    fireEvent.click(copyButtons[1])
    await waitFor(() => {
      expect(mockOnCopyEnhanced).toHaveBeenCalled()
    })
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmailComparison
        originalEmail="Original"
        enhancedEmail="Enhanced"
        className="custom-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('uses responsive grid layout', () => {
    const { container } = render(
      <EmailComparison
        originalEmail="Original"
        enhancedEmail="Enhanced"
      />
    )
    
    expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2', 'gap-6')
  })
})