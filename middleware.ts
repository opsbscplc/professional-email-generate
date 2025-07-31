import { NextRequest, NextResponse } from 'next/server'
import { 
  enforceHttps, 
  applySecurityHeaders, 
  applyCorsHeaders, 
  rateLimit, 
  getClientIdentifier 
} from './src/lib/security'

export function middleware(request: NextRequest) {
  // Enforce HTTPS in production
  const httpsRedirect = enforceHttps(request)
  if (httpsRedirect) {
    return httpsRedirect
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return applyCorsHeaders(request, applySecurityHeaders(response))
  }

  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientId = getClientIdentifier(request)
    const endpoint = request.nextUrl.pathname
    
    if (!rateLimit(endpoint, clientId)) {
      const response = NextResponse.json(
        { 
          success: false, 
          error: 'Rate limit exceeded. Please try again later.' 
        },
        { status: 429 }
      )
      
      return applySecurityHeaders(response)
    }
  }

  // Continue with the request
  const response = NextResponse.next()
  
  // Apply security headers to all responses
  applySecurityHeaders(response)
  
  // Apply CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    applyCorsHeaders(request, response)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}