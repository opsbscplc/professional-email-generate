import {
  validateTailwindClass,
  validateGlassEffect,
  getCSSCustomProperties,
  debugGlassComponent,
} from '../css-validation'

// Mock window.getComputedStyle
const mockGetComputedStyle = jest.fn()
Object.defineProperty(window, 'getComputedStyle', {
  value: mockGetComputedStyle,
})

// Mock console methods for debugGlassComponent
const mockConsole = {
  group: jest.fn(),
  log: jest.fn(),
  groupEnd: jest.fn(),
}
Object.assign(console, mockConsole)

describe('validateTailwindClass', () => {
  it('validates background classes', () => {
    expect(validateTailwindClass('bg-white')).toBe(true)
    expect(validateTailwindClass('bg-red-500')).toBe(true)
    expect(validateTailwindClass('bg-white/10')).toBe(true)
  })

  it('validates text classes', () => {
    expect(validateTailwindClass('text-white')).toBe(true)
    expect(validateTailwindClass('text-lg')).toBe(true)
    expect(validateTailwindClass('text-center')).toBe(true)
  })

  it('validates border classes', () => {
    expect(validateTailwindClass('border-white')).toBe(true)
    expect(validateTailwindClass('border-2')).toBe(true)
    expect(validateTailwindClass('border-solid')).toBe(true)
  })

  it('validates shadow classes', () => {
    expect(validateTailwindClass('shadow-lg')).toBe(true)
    expect(validateTailwindClass('shadow-xl')).toBe(true)
  })

  it('validates rounded classes', () => {
    expect(validateTailwindClass('rounded-lg')).toBe(true)
    expect(validateTailwindClass('rounded-full')).toBe(true)
  })

  it('validates padding and margin classes', () => {
    expect(validateTailwindClass('p-4')).toBe(true)
    expect(validateTailwindClass('m-2')).toBe(true)
    expect(validateTailwindClass('px-6')).toBe(true)
    expect(validateTailwindClass('my-8')).toBe(true)
  })

  it('validates width and height classes', () => {
    expect(validateTailwindClass('w-full')).toBe(true)
    expect(validateTailwindClass('h-screen')).toBe(true)
    expect(validateTailwindClass('w-1/2')).toBe(true)
  })

  it('validates flex and grid classes', () => {
    expect(validateTailwindClass('flex-col')).toBe(true)
    expect(validateTailwindClass('grid-cols-2')).toBe(true)
  })

  it('validates opacity classes', () => {
    expect(validateTailwindClass('opacity-50')).toBe(true)
    expect(validateTailwindClass('opacity-75')).toBe(true)
  })

  it('validates backdrop classes', () => {
    expect(validateTailwindClass('backdrop-blur-md')).toBe(true)
    expect(validateTailwindClass('backdrop-filter')).toBe(true)
  })

  it('validates pseudo-class modifiers', () => {
    expect(validateTailwindClass('hover:bg-white')).toBe(true)
    expect(validateTailwindClass('focus:outline-none')).toBe(true)
    expect(validateTailwindClass('active:scale-95')).toBe(true)
    expect(validateTailwindClass('disabled:opacity-50')).toBe(true)
  })

  it('validates animation classes', () => {
    expect(validateTailwindClass('animate-spin')).toBe(true)
    expect(validateTailwindClass('animate-pulse')).toBe(true)
  })

  it('validates transition classes', () => {
    expect(validateTailwindClass('transition-all')).toBe(true)
    expect(validateTailwindClass('transition-colors')).toBe(true)
  })

  it('validates opacity patterns', () => {
    expect(validateTailwindClass('bg-white/10')).toBe(true)
    expect(validateTailwindClass('text-black/50')).toBe(true)
    expect(validateTailwindClass('border-red-500/25')).toBe(true)
  })

  it('rejects invalid classes', () => {
    expect(validateTailwindClass('invalid-class')).toBe(false)
    expect(validateTailwindClass('random-text')).toBe(false)
    expect(validateTailwindClass('not-tailwind')).toBe(false)
  })

  it('handles empty strings', () => {
    expect(validateTailwindClass('')).toBe(false)
  })
})

describe('validateGlassEffect', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockGetComputedStyle.mockClear()
  })

  it('returns true for element with glass effect', () => {
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    })

    expect(validateGlassEffect(mockElement)).toBe(true)
  })

  it('returns false for element without backdrop filter', () => {
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'none',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    })

    expect(validateGlassEffect(mockElement)).toBe(false)
  })

  it('returns false for element without transparent background', () => {
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgb(255, 255, 255)',
    })

    expect(validateGlassEffect(mockElement)).toBe(false)
  })

  it('works with hsla colors', () => {
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'blur(12px)',
      backgroundColor: 'hsla(0, 0%, 100%, 0.1)',
    })

    expect(validateGlassEffect(mockElement)).toBe(true)
  })

  it('returns false for opaque backgrounds', () => {
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgb(255, 255, 255)',
    })

    expect(validateGlassEffect(mockElement)).toBe(false)
  })
})

describe('getCSSCustomProperties', () => {
  beforeEach(() => {
    mockGetComputedStyle.mockClear()
  })

  it('extracts CSS custom properties', () => {
    mockGetComputedStyle.mockReturnValue({
      length: 3,
      0: '--primary-color',
      1: '--secondary-color',
      2: 'color',
      getPropertyValue: jest.fn((prop) => {
        const values: Record<string, string> = {
          '--primary-color': '#3b82f6',
          '--secondary-color': '#ef4444',
          'color': '#000000',
        }
        return values[prop] || ''
      }),
    })

    const result = getCSSCustomProperties()

    expect(result).toEqual({
      '--primary-color': '#3b82f6',
      '--secondary-color': '#ef4444',
    })
  })

  it('handles empty custom properties', () => {
    mockGetComputedStyle.mockReturnValue({
      length: 1,
      0: 'color',
      getPropertyValue: jest.fn(() => '#000000'),
    })

    const result = getCSSCustomProperties()

    expect(result).toEqual({})
  })

  it('trims whitespace from property values', () => {
    mockGetComputedStyle.mockReturnValue({
      length: 1,
      0: '--test-prop',
      getPropertyValue: jest.fn(() => '  #ffffff  '),
    })

    const result = getCSSCustomProperties()

    expect(result).toEqual({
      '--test-prop': '#ffffff',
    })
  })
})

describe('debugGlassComponent', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockElement.className = 'backdrop-blur-md bg-white/10'
    
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'blur(12px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    })

    // Clear console mocks
    Object.values(mockConsole).forEach(mock => mock.mockClear())
  })

  it('logs debug information to console', () => {
    debugGlassComponent(mockElement)

    expect(mockConsole.group).toHaveBeenCalledWith('Glass Component Debug')
    expect(mockConsole.log).toHaveBeenCalledWith('Element:', mockElement)
    expect(mockConsole.log).toHaveBeenCalledWith('Classes:', 'backdrop-blur-md bg-white/10')
    expect(mockConsole.log).toHaveBeenCalledWith('Computed Style:', expect.any(Object))
    expect(mockConsole.log).toHaveBeenCalledWith('Has Glass Effect:', true)
    expect(mockConsole.groupEnd).toHaveBeenCalled()
  })

  it('shows correct glass effect validation', () => {
    // Mock element without glass effect
    mockGetComputedStyle.mockReturnValue({
      backdropFilter: 'none',
      backgroundColor: 'rgb(255, 255, 255)',
    })

    debugGlassComponent(mockElement)

    expect(mockConsole.log).toHaveBeenCalledWith('Has Glass Effect:', false)
  })
})