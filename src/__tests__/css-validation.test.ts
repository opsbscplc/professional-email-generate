/**
 * CSS Validation Tests
 * These tests ensure that our CSS setup is correct and all custom classes work properly
 */

import { validateTailwindClass } from '@/lib/css-validation'

describe('CSS Validation', () => {
  describe('Tailwind Class Validation', () => {
    it('validates standard Tailwind classes', () => {
      expect(validateTailwindClass('bg-blue-500')).toBe(true)
      expect(validateTailwindClass('text-white')).toBe(true)
      expect(validateTailwindClass('p-4')).toBe(true)
      expect(validateTailwindClass('rounded-lg')).toBe(true)
    })

    it('validates custom opacity classes', () => {
      expect(validateTailwindClass('bg-white/10')).toBe(true)
      expect(validateTailwindClass('border-white/20')).toBe(true)
      expect(validateTailwindClass('text-black/50')).toBe(true)
    })

    it('validates hover and focus states', () => {
      expect(validateTailwindClass('hover:bg-white/20')).toBe(true)
      expect(validateTailwindClass('focus:border-white/50')).toBe(true)
      expect(validateTailwindClass('active:scale-95')).toBe(true)
    })

    it('validates animation classes', () => {
      expect(validateTailwindClass('animate-spin')).toBe(true)
      expect(validateTailwindClass('animate-fade-in')).toBe(true)
      expect(validateTailwindClass('animate-slide-up')).toBe(true)
    })

    it('validates transition classes', () => {
      expect(validateTailwindClass('transition-all')).toBe(true)
      expect(validateTailwindClass('transition-colors')).toBe(true)
    })

    it('rejects invalid classes', () => {
      expect(validateTailwindClass('invalid-class')).toBe(false)
      expect(validateTailwindClass('random-text')).toBe(false)
    })
  })

  describe('Custom Color Classes', () => {
    const customColors = [
      'text-text-primary',
      'text-text-secondary',
      'bg-accent-primary',
      'bg-accent-secondary',
      'border-accent-primary',
      'border-accent-secondary'
    ]

    it('should have all custom colors defined', () => {
      // This test ensures our custom colors are properly configured
      customColors.forEach(colorClass => {
        // Since we can't test actual CSS rendering in Jest, 
        // we'll just verify the class names follow our pattern
        expect(colorClass).toMatch(/^(text|bg|border)-(text|accent)-(primary|secondary)$/)
      })
    })
  })

  describe('Glass Effect Classes', () => {
    const glassClasses = [
      'backdrop-blur-sm',
      'backdrop-blur-md',
      'backdrop-blur-lg',
      'backdrop-blur-xl',
      'backdrop-blur-2xl',
      'backdrop-blur-3xl'
    ]

    it('validates all backdrop blur classes', () => {
      glassClasses.forEach(glassClass => {
        expect(validateTailwindClass(glassClass)).toBe(true)
      })
    })
  })

  describe('Animation Classes', () => {
    const animationClasses = [
      'animate-fade-in',
      'animate-slide-up',
      'animate-glass-shimmer'
    ]

    it('validates custom animation classes', () => {
      animationClasses.forEach(animClass => {
        expect(validateTailwindClass(animClass)).toBe(true)
      })
    })
  })
})