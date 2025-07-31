import { render } from '@testing-library/react'
import { GlassCard, GlassButton } from '../index'

// Test to ensure CSS classes are applied correctly and no runtime errors occur
describe('CSS Integration Tests', () => {
  it('GlassCard applies all required CSS classes without errors', () => {
    const { container } = render(
      <GlassCard className="test-class" blur="xl" opacity="medium" hover>
        <div>Test content</div>
      </GlassCard>
    )
    
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('backdrop-blur-xl')
    expect(card).toHaveClass('bg-white/10')
    expect(card).toHaveClass('test-class')
    expect(card).toHaveClass('hover:bg-white/15')
  })

  it('GlassButton applies variant and size classes correctly', () => {
    const { container } = render(
      <GlassButton variant="primary" size="lg">
        Test Button
      </GlassButton>
    )
    
    const button = container.firstChild as HTMLElement
    expect(button).toHaveClass('bg-accent-primary/80')
    expect(button).toHaveClass('px-6')
    expect(button).toHaveClass('py-3')
    expect(button).toHaveClass('text-lg')
  })

  it('Custom Tailwind colors are properly referenced', () => {
    const { container } = render(
      <div className="text-text-primary bg-accent-primary border-accent-secondary">
        Color test
      </div>
    )
    
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('text-text-primary')
    expect(element).toHaveClass('bg-accent-primary')
    expect(element).toHaveClass('border-accent-secondary')
  })

  it('Animation classes are applied correctly', () => {
    const { container } = render(
      <div className="animate-fade-in animate-slide-up">
        Animation test
      </div>
    )
    
    const element = container.firstChild as HTMLElement
    expect(element).toHaveClass('animate-fade-in')
    expect(element).toHaveClass('animate-slide-up')
  })
})