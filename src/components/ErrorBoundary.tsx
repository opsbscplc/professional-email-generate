'use client'

import React from 'react'
import { ErrorMessage } from './ui/ErrorMessage'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log error to analytics/monitoring service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private getErrorMessage(error: Error): string {
    // Provide user-friendly error messages based on error types
    if (error.message.includes('ChunkLoadError')) {
      return 'Failed to load application resources. Please refresh the page.'
    }
    
    if (error.message.includes('Network')) {
      return 'Network connection error. Please check your internet connection and try again.'
    }
    
    if (error.message.includes('API')) {
      return 'Service temporarily unavailable. Please try again in a moment.'
    }
    
    return 'An unexpected error occurred. Please try refreshing the page.'
  }

  private getErrorSuggestions(error: Error): string[] {
    const suggestions: string[] = []
    
    if (error.message.includes('ChunkLoadError')) {
      suggestions.push('Refresh the page to reload the application')
      suggestions.push('Clear your browser cache if the problem persists')
    } else if (error.message.includes('Network')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try again in a few moments')
    } else if (error.message.includes('API')) {
      suggestions.push('Wait a moment and try again')
      suggestions.push('Check if your API key is still valid')
    } else {
      suggestions.push('Refresh the page')
      suggestions.push('Try clearing your browser cache')
      suggestions.push('Contact support if the problem continues')
    }
    
    return suggestions
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props
      
      if (Fallback) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />
      }

      const errorMessage = this.getErrorMessage(this.state.error)
      const suggestions = this.getErrorSuggestions(this.state.error)

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage
              title="Application Error"
              message={errorMessage}
              onRetry={this.handleRetry}
              variant="error"
            />
            {suggestions.length > 0 && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                <h4 className="font-medium text-gray-800 mb-2">Suggestions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    setError(error)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Async error caught:', error)
    }
    
    // Log to error service
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        type: 'async',
      }),
    }).catch(console.error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  // Throw error to be caught by ErrorBoundary
  if (error) {
    throw error
  }

  return { handleError, clearError }
}