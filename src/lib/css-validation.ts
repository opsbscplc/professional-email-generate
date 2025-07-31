// CSS validation utilities to help catch potential issues

export const validateTailwindClass = (className: string): boolean => {
  // Basic validation for common Tailwind patterns
  const validPatterns = [
    /^(bg|text|border|shadow|rounded|p|m|w|h|flex|grid|opacity|backdrop)-/,
    /^(hover|focus|active|disabled):/,
    /^animate-/,
    /^transition-/,
    /^\w+\/\d+$/, // opacity patterns like bg-white/10
  ]
  
  return validPatterns.some(pattern => pattern.test(className))
}

export const validateGlassEffect = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element)
  
  // Check for backdrop-filter (glass effect)
  const hasBackdropFilter = computedStyle.backdropFilter !== 'none'
  
  // Check for semi-transparent background
  const backgroundColor = computedStyle.backgroundColor
  const hasTransparentBg = backgroundColor.includes('rgba') || backgroundColor.includes('hsla')
  
  return hasBackdropFilter && hasTransparentBg
}

export const getCSSCustomProperties = (): Record<string, string> => {
  const root = document.documentElement
  const computedStyle = window.getComputedStyle(root)
  
  const customProperties: Record<string, string> = {}
  
  // Get all CSS custom properties (variables)
  for (let i = 0; i < computedStyle.length; i++) {
    const property = computedStyle[i]
    if (property.startsWith('--')) {
      customProperties[property] = computedStyle.getPropertyValue(property).trim()
    }
  }
  
  return customProperties
}

export const debugGlassComponent = (element: HTMLElement): void => {
  console.group('Glass Component Debug')
  console.log('Element:', element)
  console.log('Classes:', element.className)
  console.log('Computed Style:', window.getComputedStyle(element))
  console.log('Has Glass Effect:', validateGlassEffect(element))
  console.groupEnd()
}