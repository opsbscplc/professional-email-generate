import { requestDeduplicator } from '../request-deduplication'

// Mock fetch
global.fetch = jest.fn()

describe('RequestDeduplicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requestDeduplicator.cancelAll()
  })

  it('deduplicates identical requests', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response)

    const url = '/api/test'
    const options = { method: 'POST', body: JSON.stringify({ test: true }) }

    // Make two identical requests simultaneously
    const [result1, result2] = await Promise.all([
      requestDeduplicator.deduplicate(url, options),
      requestDeduplicator.deduplicate(url, options),
    ])

    // Should only make one actual fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1)
    
    // Both results should be the same
    expect(result1).toEqual(result2)
    expect(result1).toEqual({ data: 'test' })
  })

  it('does not deduplicate different requests', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response)

    const url1 = '/api/test1'
    const url2 = '/api/test2'

    // Make two different requests simultaneously
    await Promise.all([
      requestDeduplicator.deduplicate(url1),
      requestDeduplicator.deduplicate(url2),
    ])

    // Should make two separate fetch calls
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('uses custom fetcher when provided', async () => {
    const customFetcher = jest.fn().mockResolvedValue({ custom: 'data' })
    
    const result = await requestDeduplicator.deduplicate(
      '/api/test',
      {},
      customFetcher
    )

    expect(customFetcher).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ custom: 'data' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('cleans up after request completes', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response)

    const url = '/api/test'
    
    // Make first request
    await requestDeduplicator.deduplicate(url)
    
    // Make second request after first completes
    await requestDeduplicator.deduplicate(url)

    // Should make two separate calls since first completed
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('handles request failures correctly', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockRejectedValue(new Error('Network error'))

    const url = '/api/test'
    
    await expect(requestDeduplicator.deduplicate(url)).rejects.toThrow('Network error')
    
    // Should clean up after failure
    expect(requestDeduplicator.getPendingCount()).toBe(0)
  })

  it('cancels specific requests', async () => {
    const url = '/api/test'
    const options = { method: 'POST' }
    
    // Start tracking a request
    const promise = requestDeduplicator.deduplicate(url, options, () => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
    )
    
    // Cancel it
    requestDeduplicator.cancel(url, options)
    
    // Should not be pending anymore
    expect(requestDeduplicator.getPendingCount()).toBe(0)
  })

  it('cancels all requests', async () => {
    // Start multiple requests
    requestDeduplicator.deduplicate('/api/test1', {}, () => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test1' }), 100))
    )
    requestDeduplicator.deduplicate('/api/test2', {}, () => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test2' }), 100))
    )
    
    expect(requestDeduplicator.getPendingCount()).toBe(2)
    
    // Cancel all
    requestDeduplicator.cancelAll()
    
    expect(requestDeduplicator.getPendingCount()).toBe(0)
  })

  it('cleans up expired requests', async () => {
    // Mock Date.now to control time
    const originalNow = Date.now
    let currentTime = 1000000
    Date.now = jest.fn(() => currentTime)

    try {
      // Start a request
      requestDeduplicator.deduplicate('/api/test', {}, () => 
        new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 200))
      )
      
      expect(requestDeduplicator.getPendingCount()).toBe(1)
      
      // Advance time beyond max age (30 seconds)
      currentTime += 31000
      
      // Trigger cleanup by checking pending count
      expect(requestDeduplicator.getPendingCount()).toBe(0)
    } finally {
      Date.now = originalNow
    }
  })

  it('generates different keys for different request parameters', () => {
    const deduplicator = requestDeduplicator as any
    
    const key1 = deduplicator.generateKey('/api/test', { method: 'GET' })
    const key2 = deduplicator.generateKey('/api/test', { method: 'POST' })
    const key3 = deduplicator.generateKey('/api/test', { 
      method: 'POST', 
      body: JSON.stringify({ data: 'test' }) 
    })
    
    expect(key1).not.toBe(key2)
    expect(key2).not.toBe(key3)
    expect(key1).not.toBe(key3)
  })
})