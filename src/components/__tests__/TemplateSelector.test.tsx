import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TemplateSelector } from '../TemplateSelector'
import { EmailTemplate } from '@/types/gemini'

describe('TemplateSelector', () => {
  const mockOnTemplateChange = jest.fn()

  beforeEach(() => {
    mockOnTemplateChange.mockClear()
  })

  it('renders all six template options', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    expect(screen.getByText('Professional')).toBeInTheDocument()
    expect(screen.getByText('Friend')).toBeInTheDocument()
    expect(screen.getByText('Polite')).toBeInTheDocument()
    expect(screen.getByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('Follow up')).toBeInTheDocument()
    expect(screen.getByText('Reminder')).toBeInTheDocument()
  })

  it('displays template descriptions', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    expect(screen.getByText('Formal tone suitable for office communication')).toBeInTheDocument()
    expect(screen.getByText('Casual and warm tone for personal communication')).toBeInTheDocument()
    expect(screen.getByText('Extra courteous with respectful language')).toBeInTheDocument()
    expect(screen.getByText('Concise and straight to the point')).toBeInTheDocument()
    expect(screen.getByText('Professional follow-up with context')).toBeInTheDocument()
    expect(screen.getByText('Gentle reminder that prompts action')).toBeInTheDocument()
  })

  it('calls onTemplateChange when a template is clicked', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    fireEvent.click(screen.getByText('Professional'))
    expect(mockOnTemplateChange).toHaveBeenCalledWith(EmailTemplate.PROFESSIONAL)

    fireEvent.click(screen.getByText('Friend'))
    expect(mockOnTemplateChange).toHaveBeenCalledWith(EmailTemplate.FRIEND)
  })

  it('shows visual feedback for selected template', () => {
    render(
      <TemplateSelector
        selectedTemplate={EmailTemplate.PROFESSIONAL}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    // Find the card container (GlassCard) that contains the Professional template
    const professionalCard = screen.getByText('Professional').closest('[class*="ring-2"]')
    expect(professionalCard).toHaveClass('ring-2', 'ring-accent-primary')
    
    // Check for checkmark SVG
    const checkmark = screen.getByRole('img', { hidden: true })
    expect(checkmark).toBeInTheDocument()
  })

  it('displays selection confirmation message', () => {
    render(
      <TemplateSelector
        selectedTemplate={EmailTemplate.POLITE}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    expect(screen.getByText('✓ Polite template selected')).toBeInTheDocument()
  })

  it('allows only single template selection', () => {
    const { rerender } = render(
      <TemplateSelector
        selectedTemplate={EmailTemplate.PROFESSIONAL}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    // Professional should be selected
    expect(screen.getByText('✓ Professional template selected')).toBeInTheDocument()

    // Click on Friend template
    fireEvent.click(screen.getByText('Friend'))
    expect(mockOnTemplateChange).toHaveBeenCalledWith(EmailTemplate.FRIEND)

    // Simulate parent component updating the selected template
    rerender(
      <TemplateSelector
        selectedTemplate={EmailTemplate.FRIEND}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    // Now Friend should be selected and Professional should not
    expect(screen.getByText('✓ Friend template selected')).toBeInTheDocument()
    expect(screen.queryByText('✓ Professional template selected')).not.toBeInTheDocument()
  })

  it('disables interaction when disabled prop is true', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
        disabled={true}
      />
    )

    // Find the card container that should have disabled styles
    const professionalCard = screen.getByText('Professional').closest('[class*="opacity-50"]')
    expect(professionalCard).toHaveClass('opacity-50', 'cursor-not-allowed')

    fireEvent.click(screen.getByText('Professional'))
    expect(mockOnTemplateChange).not.toHaveBeenCalled()
  })

  it('applies hover effects when not disabled and not selected', () => {
    render(
      <TemplateSelector
        selectedTemplate={EmailTemplate.PROFESSIONAL}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    // Find the card container that should have hover effects
    const friendCard = screen.getByText('Friend').closest('[class*="hover:bg-white"]')
    expect(friendCard).toHaveClass('hover:bg-white/15', 'hover:border-white/30')
  })

  it('displays template icons', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    // Check for emoji icons (they should be present as text content)
    expect(screen.getByText('💼')).toBeInTheDocument() // Professional
    expect(screen.getByText('👋')).toBeInTheDocument() // Friend
    expect(screen.getByText('🙏')).toBeInTheDocument() // Polite
    expect(screen.getByText('🎯')).toBeInTheDocument() // Direct
    expect(screen.getByText('📧')).toBeInTheDocument() // Follow up
    expect(screen.getByText('⏰')).toBeInTheDocument() // Reminder
  })

  it('applies custom className', () => {
    const { container } = render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('shows instruction text', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateChange={mockOnTemplateChange}
      />
    )

    expect(screen.getByText('Choose Email Template')).toBeInTheDocument()
    expect(screen.getByText('Select one template to enhance your email draft')).toBeInTheDocument()
  })
})