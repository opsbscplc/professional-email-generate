interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private readonly maxAge = 30000 // 30 seconds

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    const headers = options?.headers ? JSON.stringify(options.headers) : ''
    
    return `${method}:${url}:${body}:${headers}`
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.pendingRequests.forEach((request, key) => {
      if (now - request.timestamp > this.maxAge) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => {
      this.pendingRequests.delete(key)
    })
  }

  async deduplicate<T>(
    url: string,
    options?: RequestInit,
    fetcher: () => Promise<T> = () => fetch(url, options).then(r => r.json())
  ): Promise<T> {
    this.cleanupExpiredRequests()
    
    const key = this.generateKey(url, options)
    const existing = this.pendingRequests.get(key)
    
    if (existing) {
      // Return the existing promise
      return existing.promise
    }
    
    // Create new request
    const promise = fetcher().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })
    
    return promise
  }

  cancel(url: string, options?: RequestInit): void {
    const key = this.generateKey(url, options)
    this.pendingRequests.delete(key)
  }

  cancelAll(): void {
    this.pendingRequests.clear()
  }

  getPendingCount(): number {
    this.cleanupExpiredRequests()
    return this.pendingRequests.size
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator()

// Hook for using request deduplication in React components
export function useRequestDeduplication() {
  const [pendingRequests, setPendingRequests] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPendingRequests(requestDeduplicator.getPendingCount())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const deduplicatedFetch = React.useCallback(
    async <T>(
      url: string,
      options?: RequestInit,
      fetcher?: () => Promise<T>
    ): Promise<T> => {
      return requestDeduplicator.deduplicate(url, options, fetcher)
    },
    []
  )

  const cancelRequest = React.useCallback(
    (url: string, options?: RequestInit) => {
      requestDeduplicator.cancel(url, options)
    },
    []
  )

  const cancelAllRequests = React.useCallback(() => {
    requestDeduplicator.cancelAll()
  }, [])

  return {
    deduplicatedFetch,
    cancelRequest,
    cancelAllRequests,
    pendingRequests,
  }
}

// Utility for preventing double submissions
export function useSubmissionPrevention() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [lastSubmission, setLastSubmission] = React.useState<number>(0)
  const minInterval = 1000 // Minimum 1 second between submissions

  const preventDoubleSubmission = React.useCallback(
    async <T>(submitFn: () => Promise<T>): Promise<T> => {
      const now = Date.now()
      
      if (isSubmitting) {
        throw new Error('Submission already in progress')
      }
      
      if (now - lastSubmission < minInterval) {
        throw new Error('Please wait before submitting again')
      }

      setIsSubmitting(true)
      setLastSubmission(now)

      try {
        const result = await submitFn()
        return result
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, lastSubmission, minInterval]
  )

  return {
    isSubmitting,
    preventDoubleSubmission,
    canSubmit: !isSubmitting && Date.now() - lastSubmission >= minInterval,
  }
}

import React from 'react'