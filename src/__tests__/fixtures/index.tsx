/**
 * Test Data Fixtures and Mocking Utilities
 * Centralized test data and mock functions for consistent testing
 */

import { EmailTemplate, GeminiRequest, GeminiResponse } from '@/types'

// API Key Fixtures
export const API_KEYS = {
  VALID: 'AIzaSyTestKey1234567890123456789012345',
  INVALID: 'invalid-key',
  WEAK: 'test',
  DEMO: 'demo',
  EXPIRED: 'AIzaSyExpiredKey123456789012345678901',
}

// Email Template Fixtures
export const EMAIL_TEMPLATES = {
  PROFESSIONAL: {
    type: EmailTemplate.PROFESSIONAL,
    name: 'Professional',
    description: 'Formal business communication',
    example: 'Dear [Name], I hope this email finds you well...',
  },
  FRIEND: {
    type: EmailTemplate.FRIEND,
    name: 'Friend',
    description: 'Casual conversation with friends',
    example: 'Hey [Name]! Hope you\'re doing great...',
  },
  POLITE: {
    type: EmailTemplate.POLITE,
    name: 'Polite',
    description: 'Courteous and respectful tone',
    example: 'Hello [Name], I would like to kindly request...',
  },
  DIRECT: {
    type: EmailTemplate.DIRECT,
    name: 'Direct',
    description: 'Straight to the point',
    example: 'Hi [Name], I need to discuss...',
  },
  FOLLOWUP: {
    type: EmailTemplate.FOLLOWUP,
    name: 'Follow-up',
    description: 'Following up on previous communication',
    example: 'Hi [Name], Following up on our previous conversation...',
  },
  REMINDER: {
    type: EmailTemplate.REMINDER,
    name: 'Reminder',
    description: 'Gentle reminder about something',
    example: 'Hi [Name], This is a friendly reminder about...',
  },
}

// Sample Email Content
export const SAMPLE_EMAILS = {
  DRAFT: {
    SHORT: 'Hi, can we meet tomorrow?',
    MEDIUM: 'Hi John, I wanted to follow up on our meeting yesterday. Can we schedule another one for tomorrow to discuss the project details?',
    LONG: `Hi John,

I hope this email finds you well. I wanted to follow up on our productive meeting yesterday regarding the new project proposal.

During our discussion, we covered several important points:
- Project timeline and milestones
- Budget allocation and resources
- Team assignments and responsibilities
- Risk assessment and mitigation strategies

I believe we made significant progress, but there are still a few items that require further discussion. Would it be possible to schedule another meeting for tomorrow afternoon? I'm available between 2 PM and 5 PM.

Please let me know what works best for your schedule.

Best regards,
[Your Name]`,
  },
  ENHANCED: {
    PROFESSIONAL: `Dear John,

I trust this message finds you in good health and high spirits. I am writing to follow up on our productive meeting yesterday concerning the new project proposal.

Our discussion covered several critical aspects:
• Project timeline and key milestones
• Budget allocation and resource management
• Team structure and role assignments
• Risk assessment and mitigation protocols

While we made substantial progress, I believe there are additional matters that warrant further deliberation. Would you be available for a follow-up meeting tomorrow afternoon? I have availability between 2:00 PM and 5:00 PM.

I would greatly appreciate your confirmation at your earliest convenience.

Warm regards,
[Your Name]`,
    CASUAL: `Hey John!

Hope you're doing well! Just wanted to touch base about our chat yesterday - that project sounds really exciting!

We covered a lot of ground:
- Timeline stuff
- Budget and resources
- Who's doing what
- Potential roadblocks

I think we're on the right track, but there are a few more things we should hash out. Free for another quick meeting tomorrow afternoon? I'm open from 2-5 PM.

Let me know what works!

Cheers,
[Your Name]`,
  },
}

// Gemini API Request/Response Fixtures
export const GEMINI_FIXTURES = {
  REQUESTS: {
    ENHANCE_EMAIL: {
      apiKey: API_KEYS.VALID,
      prompt: SAMPLE_EMAILS.DRAFT.MEDIUM,
      template: EmailTemplate.PROFESSIONAL,
    } as GeminiRequest,
    TRAIN_AI: {
      apiKey: API_KEYS.VALID,
      prompt: 'Train with this example',
      trainingData: {
        input: 'Casual meeting request',
        output: 'Hey! Want to grab coffee and chat about the project?',
      },
    } as GeminiRequest,
  },
  RESPONSES: {
    SUCCESS: {
      success: true,
      data: SAMPLE_EMAILS.ENHANCED.PROFESSIONAL,
    } as GeminiResponse,
    ERROR: {
      success: false,
      error: 'API key is invalid or expired',
    } as GeminiResponse,
    RATE_LIMITED: {
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
    } as GeminiResponse,
  },
}

// User Interaction Fixtures
export const USER_INTERACTIONS = {
  FORM_DATA: {
    VALID_API_KEY: {
      apiKey: API_KEYS.VALID,
    },
    INVALID_API_KEY: {
      apiKey: API_KEYS.INVALID,
    },
    EMAIL_ENHANCEMENT: {
      template: EmailTemplate.PROFESSIONAL,
      draftEmail: SAMPLE_EMAILS.DRAFT.MEDIUM,
    },
    TRAINING_DATA: {
      input: 'Meeting request',
      output: 'Professional meeting invitation',
      testInput: 'Follow-up meeting',
    },
  },
  NAVIGATION: {
    ROUTES: [
      '/',
      '/template-enhancer',
      '/trainer',
    ],
    EXTERNAL_LINKS: [
      'https://ai.google.dev/gemini-api',
      'https://nextjs.org',
      'https://tailwindcss.com',
    ],
  },
}

// Error Scenarios
export const ERROR_SCENARIOS = {
  API_ERRORS: {
    NETWORK_ERROR: new Error('Network request failed'),
    TIMEOUT_ERROR: new Error('Request timeout'),
    SERVER_ERROR: new Error('Internal server error'),
    INVALID_RESPONSE: new Error('Invalid response format'),
  },
  VALIDATION_ERRORS: {
    EMPTY_API_KEY: 'API key is required',
    INVALID_API_KEY: 'Invalid API key format',
    EMPTY_EMAIL: 'Email content is required',
    EMAIL_TOO_LONG: 'Email content is too long',
  },
  SECURITY_ERRORS: {
    XSS_ATTEMPT: '<script>alert("xss")</script>',
    SQL_INJECTION: "'; DROP TABLE users; --",
    MALICIOUS_HTML: '<img src="x" onerror="alert(1)">',
  },
}

// Performance Test Data
export const PERFORMANCE_DATA = {
  LARGE_EMAIL: 'This is a very long email content. '.repeat(1000),
  STRESS_TEST_REQUESTS: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    prompt: `Test email ${i}`,
    template: Object.values(EmailTemplate)[i % Object.values(EmailTemplate).length],
  })),
}

// Mock Functions
export const createMockApiResponse = (
  data: any,
  status = 200,
  delay = 0
): Promise<Response> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
      } as Response)
    }, delay)
  })
}

export const createMockLocalStorage = () => {
  const storage: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key]
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    length: Object.keys(storage).length,
    key: jest.fn((index: number) => Object.keys(storage)[index] || null),
  }
}

export const createMockNextRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
})

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  })
  
  return mockIntersectionObserver
}

export const createMockResizeObserver = () => {
  const mockResizeObserver = jest.fn()
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  })
  
  return mockResizeObserver
}

// Test Utilities
export const waitForAsync = (ms = 0) => 
  new Promise(resolve => setTimeout(resolve, ms))

export const createMockEvent = (type: string, properties: any = {}) => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...properties,
})

export const createMockFile = (
  name: string,
  content: string,
  type = 'text/plain'
) => {
  const file = new File([content], name, { type })
  return file
}

// Component Test Helpers
export const renderWithProviders = (
  ui: React.ReactElement,
  options: any = {}
) => {
  // This would be implemented with actual providers
  // For now, it's a placeholder for the pattern
  return ui
}

export const createMockComponent = (name: string) => {
  const MockComponent = ({ children, ...props }: any) => (
    <div data-testid={`mock-${name.toLowerCase()}`} {...props}>
      {children}
    </div>
  )
  MockComponent.displayName = `Mock${name}`
  return MockComponent
}