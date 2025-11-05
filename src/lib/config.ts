/**
 * Application Configuration
 * Centralized configuration management for different environments
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test'
  isProduction: boolean
  isDevelopment: boolean
  isTest: boolean
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  cache: {
    ttl: number
    maxSize: number
  }
  performance: {
    enableTracking: boolean
    enableWebVitals: boolean
    reportThreshold: number
  }
  security: {
    enableCSP: boolean
    enableHSTS: boolean
    sessionTimeout: number
  }
  features: {
    enableAnalytics: boolean
    enableErrorReporting: boolean
    enablePerformanceMonitoring: boolean
  }
}

function getConfig(): AppConfig {
  const env = (process.env.NODE_ENV as AppConfig['env']) || 'development'
  const isProduction = env === 'production'
  const isDevelopment = env === 'development'
  const isTest = env === 'test'

  return {
    env,
    isProduction,
    isDevelopment,
    isTest,
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
      timeout: isProduction ? 30000 : 10000,
      retries: isProduction ? 3 : 1,
    },
    cache: {
      ttl: isProduction ? 300000 : 60000, // 5 minutes in prod, 1 minute in dev
      maxSize: isProduction ? 100 : 50,
    },
    performance: {
      enableTracking: isProduction,
      enableWebVitals: isProduction,
      reportThreshold: isProduction ? 1000 : 5000, // Report slower operations in prod
    },
    security: {
      enableCSP: isProduction,
      enableHSTS: isProduction,
      sessionTimeout: isProduction ? 3600000 : 86400000, // 1 hour in prod, 24 hours in dev
    },
    features: {
      enableAnalytics: isProduction,
      enableErrorReporting: isProduction,
      enablePerformanceMonitoring: isProduction,
    },
  }
}

export const config = getConfig()

// Environment-specific utilities
export const isServer = typeof window === 'undefined'
export const isClient = typeof window !== 'undefined'

// Feature flags
export const featureFlags = {
  enableBetaFeatures: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true',
  enableDebugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || !config.isProduction,
  enablePerformanceDebugging: process.env.NEXT_PUBLIC_PERFORMANCE_DEBUG === 'true',
}

// API endpoints
export const apiEndpoints = {
  gemini: '/api/gemini',
  geminiTest: '/api/gemini/test',
  analytics: '/api/analytics',
  health: '/api/health',
  errors: '/api/errors',
}

// Performance thresholds (in milliseconds)
export const performanceThresholds = {
  // Core Web Vitals thresholds
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  
  // Custom thresholds
  apiResponse: { good: 1000, poor: 3000 },
  pageLoad: { good: 2000, poor: 5000 },
  componentRender: { good: 16, poor: 50 }, // 60fps = 16ms per frame
}

// Cache configuration
export const cacheConfig = {
  apiResponses: {
    ttl: config.cache.ttl,
    maxSize: config.cache.maxSize,
  },
  staticAssets: {
    ttl: config.isProduction ? 86400000 : 3600000, // 24 hours in prod, 1 hour in dev
  },
}

// Security configuration
export const securityConfig = {
  apiKey: {
    minLength: 20,
    pattern: /^AI[a-zA-Z0-9_-]+$/,
  },
  session: {
    timeout: config.security.sessionTimeout,
    storageKey: 'email-generator-session',
  },
  rateLimiting: {
    maxRequests: config.isProduction ? 10 : 100,
    windowMs: 60000, // 1 minute
  },
}

// Logging configuration
export const loggingConfig = {
  level: config.isProduction ? 'error' : 'debug',
  enableConsole: !config.isProduction,
  enableRemote: config.isProduction,
}

export default config