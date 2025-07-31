import DOMPurify from 'isomorphic-dompurify'

// Conditional import for Next.js types (only available in server environment)
type NextRequest = any
type NextResponse = any

// Try to import Next.js types if available
let NextRequestType: any
let NextResponseType: any

try {
  const nextServer = require('next/server')
  NextRequestType = nextServer.NextRequest
  NextResponseType = nextServer.NextResponse
} catch (error) {
  // Next.js not available in test environment
}

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

// In-memory rate limiting store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/gemini': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
  '/api/analytics': { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute
  '/api/errors': { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  default: { windowMs: 60000, maxRequests: 50 } // 50 requests per minute for other endpoints
}

// Session timeout configuration (in milliseconds)
export const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

// Security headers configuration
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// CORS configuration
export const CORS_CONFIG = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] // Replace with actual domain
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}

/**
 * Input sanitization utility
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove potential XSS vectors
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })

  // Additional sanitization for email content
  sanitized = sanitized
    .replace(/javascript:[^"'\s]*/gi, '') // Remove javascript: protocol and everything after
    .replace(/data:[^"'\s]*/gi, '') // Remove data: protocol and everything after
    .replace(/vbscript:[^"'\s]*/gi, '') // Remove vbscript: protocol and everything after
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers with quotes
    .replace(/on\w+\s*=\s*[^"'\s>]+/gi, '') // Remove event handlers without quotes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  return sanitized
}

/**
 * Validate and sanitize email content
 */
export function sanitizeEmailContent(content: string): string {
  if (!content || typeof content !== 'string') {
    throw new Error('Email content cannot be empty')
  }

  // Basic length validation
  if (content.length > 10000) {
    throw new Error('Email content too long (maximum 10,000 characters)')
  }

  // Check if content is empty or only whitespace
  if (content.trim().length === 0) {
    throw new Error('Email content cannot be empty')
  }

  // Sanitize the content
  const sanitized = sanitizeInput(content)

  // Validate that content isn't empty after sanitization
  if (sanitized.trim().length === 0) {
    throw new Error('Email content cannot be empty')
  }

  return sanitized
}

/**
 * Rate limiting middleware
 */
export function rateLimit(endpoint: string, identifier: string): boolean {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const now = Date.now()
  const key = `${endpoint}:${identifier}`

  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    // Reset or initialize the counter
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return true
  }

  if (current.count >= config.maxRequests) {
    return false // Rate limit exceeded
  }

  // Increment the counter
  current.count++
  rateLimitStore.set(key, current)
  return true
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: any): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // For additional security, you could also include user agent
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a simple hash of IP + User Agent for rate limiting
  return `${ip}:${userAgent.slice(0, 50)}`
}

/**
 * Enforce HTTPS in production
 */
export function enforceHttps(request: any): any | null {
  if (process.env.NODE_ENV === 'production') {
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    
    if (protocol !== 'https') {
      const httpsUrl = new URL(request.url)
      httpsUrl.protocol = 'https:'
      
      if (NextResponseType) {
        return NextResponseType.redirect(httpsUrl.toString(), 301)
      }
    }
  }
  
  return null
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: any): any {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Apply CORS headers
 */
export function applyCorsHeaders(request: any, response: any): any {
  const origin = request.headers.get('origin')
  
  if (origin && CORS_CONFIG.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  
  if (CORS_CONFIG.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

/**
 * Validate API key format and security
 */
export function validateApiKeyFormat(apiKey: string): { isValid: boolean; error?: string } {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key is required' }
  }

  const trimmed = apiKey.trim()

  // Check basic format
  if (trimmed.length < 20 || trimmed.length > 50) {
    return { isValid: false, error: 'Invalid API key format' }
  }

  // Check if it starts with expected prefix
  if (!trimmed.startsWith('AI')) {
    return { isValid: false, error: 'Invalid API key format' }
  }

  // Check for valid characters only
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'API key contains invalid characters' }
  }

  // Check for common security issues
  if (trimmed.toLowerCase().includes('test') || 
      trimmed.toLowerCase().includes('demo') ||
      trimmed.toLowerCase().includes('example')) {
    return { isValid: false, error: 'Invalid API key - appears to be a test key' }
  }

  return { isValid: true }
}

/**
 * Session timeout validation
 */
export function validateSessionTimeout(sessionStart: number): boolean {
  const now = Date.now()
  return (now - sessionStart) < SESSION_TIMEOUT
}

/**
 * Clean up rate limit store (should be called periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}