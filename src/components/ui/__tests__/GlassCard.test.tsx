import { render, screen, fireEvent } from '@testing-library/react'
import { GlassCard } from '../GlassCard'

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default blur and opacity classes', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('backdrop-blur-xl')
    expect(card).toHaveClass('bg-white/10')
  })

  it('applies custom blur level', () => {
    const { container } = render(
      <GlassCard blur="sm">
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('backdrop-blur-sm')
  })

  it('applies custom opacity level', () => {
    const { container } = render(
      <GlassCard opacity="high">
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('bg-white/20')
  })

  it('applies hover effects when hover prop is true', () => {
    const { container } = render(
      <GlassCard hover>
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('hover:bg-white/15')
    expect(card).toHaveClass('hover:border-white/30')
    expect(card).toHaveClass('hover:shadow-xl')
    expect(card).toHaveClass('hover:scale-[1.02]')
  })

  it('applies cursor pointer when onClick is provided', () => {
    const mockClick = jest.fn()
    const { container } = render(
      <GlassCard onClick={mockClick}>
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('cursor-pointer')
  })

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn()
    const { container } = render(
      <GlassCard onClick={mockClick}>
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    fireEvent.click(card)
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })

  it('applies all blur variants correctly', () => {
    const blurVariants = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
    
    blurVariants.forEach(blur => {
      const { container } = render(
        <GlassCard blur={blur}>
          <div>Content</div>
        </GlassCard>
      )
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass(`backdrop-blur-${blur}`)
    })
  })

  it('applies all opacity variants correctly', () => {
    const opacityVariants = [
      { variant: 'low' as const, class: 'bg-white/5' },
      { variant: 'medium' as const, class: 'bg-white/10' },
      { variant: 'high' as const, class: 'bg-white/20' },
    ]
    
    opacityVariants.forEach(({ variant, class: expectedClass }) => {
      const { container } = render(
        <GlassCard opacity={variant}>
          <div>Content</div>
        </GlassCard>
      )
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass(expectedClass)
    })
  })

  it('has proper base styling classes', () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-xl')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('border-white/20')
    expect(card).toHaveClass('shadow-lg')
    expect(card).toHaveClass('transition-all')
    expect(card).toHaveClass('duration-300')
  })
})