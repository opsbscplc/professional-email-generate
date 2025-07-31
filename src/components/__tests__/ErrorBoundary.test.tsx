import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, beforeEach, afterEach } from '@jest/globals'
import { ErrorBoundary, useErrorHandler } from '@/components/ErrorBoundary'

// Mock fetch for error logging
global.fetch = jest.fn()

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Test component for async error handling
const AsyncErrorComponent = () => {
  const { handleError } = useErrorHandler()
  
  const triggerError = () => {
    handleError(new Error('Async test error'))
  }
  
  return (
    <button onClick={triggerError}>Trigger Async Error</button>
  )
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Application Error')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
  })

  it('provides retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Application Error')).toBeInTheDocument()

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    // After retry, should render children again
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('shows appropriate error message for network errors', () => {
    const NetworkError = () => {
      throw new Error('Failed to fetch')
    }

    render(
      <ErrorBoundary>
        <NetworkError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Network connection error/)).toBeInTheDocument()
    expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument()
  })

  it('shows appropriate error message for chunk load errors', () => {
    const ChunkError = () => {
      throw new Error('ChunkLoadError: Loading chunk failed')
    }

    render(
      <ErrorBoundary>
        <ChunkError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument()
    expect(screen.getByText(/Refresh the page to reload the application/)).toBeInTheDocument()
  })

  it('logs errors to the error service', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Test error'),
      })
    })
  })

  it('handles custom fallback component', () => {
    const CustomFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
      <div>
        <h1>Custom Error: {error.message}</h1>
        <button onClick={retry}>Custom Retry</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument()
    expect(screen.getByText('Custom Retry')).toBeInTheDocument()
  })

  it('calls onError callback when provided', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })
})

describe('useErrorHandler', () => {
  it('handles async errors correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    )

    const button = screen.getByText('Trigger Async Error')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Application Error')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Async test error'),
      })
    })
  })
})