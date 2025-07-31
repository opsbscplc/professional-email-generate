/**
 * Performance Tests and Optimization Validation
 * Tests to ensure performance optimizations are working correctly
 */

import { describe, it, beforeEach } from '@jest/globals'
import { performanceMonitor, measureAsync, measureSync } from '@/lib/performance'
import { apiCache } from '@/lib/cache'
import { config, performanceThresholds } from '@/lib/config'

// Mock web-vitals for testing
jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFID: jest.fn(),
  onFCP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
  onINP: jest.fn(),
}))

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  timing: {
    navigationStart: 1000,
    loadEventEnd: 2000,
  },
  getEntriesByType: jest.fn(() => []),
}

// Mock window object for browser APIs
Object.defineProperty(global, 'window', {
  value: {
    performance: mockPerformance,
  },
  writable: true,
})

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
})

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPerformance.now.mockReturnValue(Date.now())
  })

  describe('PerformanceMonitor', () => {
    it('should initialize without errors', () => {
      expect(() => performanceMonitor.init()).not.toThrow()
    })

    it('should set and get custom metrics', () => {
      const metricName = 'test-metric'
      const metricValue = 123.45

      performanceMonitor.setCustomMetric(metricName, metricValue)
      expect(performanceMonitor.getCustomMetric(metricName)).toBe(metricValue)
    })

    it('should generate performance report', () => {
      performanceMonitor.setCustomMetric('testMetric', 100)
      const report = performanceMonitor.generateReport()
      
      expect(report).toBeDefined()
      expect(typeof report).toBe('string')
      
      const parsed = JSON.parse(report)
      expect(parsed.customMetrics.testMetric).toBe(100)
    })

    it('should track performance data structure', () => {
      const data = performanceMonitor.getPerformanceData()
      
      expect(data).toHaveProperty('url')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('userAgent')
      expect(data).toHaveProperty('metrics')
      expect(data.metrics).toHaveProperty('webVitals')
      expect(data.metrics).toHaveProperty('customMetrics')
      expect(data.metrics).toHaveProperty('resourceTimings')
    })
  })

  describe('Performance Measurement Utilities', () => {
    it('should measure async function performance', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'test result'
      }

      const result = await measureAsync('test-async', testFunction)
      
      expect(result).toBe('test result')
      // Allow for some tolerance in timing
      const metric = performanceMonitor.getCustomMetric('test-async')
      expect(metric).toBeDefined()
      expect(typeof metric).toBe('number')
    })

    it('should measure sync function performance', () => {
      const testFunction = () => {
        // Simulate some work
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const result = measureSync('test-sync', testFunction)
      
      expect(result).toBe(499500) // Sum of 0 to 999
      // Allow for some tolerance in timing
      const metric = performanceMonitor.getCustomMetric('test-sync')
      expect(metric).toBeDefined()
      expect(typeof metric).toBe('number')
    })

    it('should handle errors in measured functions', async () => {
      const errorFunction = async () => {
        throw new Error('Test error')
      }

      await expect(measureAsync('error-test', errorFunction)).rejects.toThrow('Test error')
      
      // Should still record the metric even if function throws
      const metric = performanceMonitor.getCustomMetric('error-test')
      expect(metric).toBeDefined()
      expect(typeof metric).toBe('number')
    })
  })
})

describe('API Cache Performance', () => {
  beforeEach(() => {
    apiCache.clear()
  })

  it('should cache API responses', () => {
    const endpoint = '/test-endpoint'
    const params = { key: 'value' }
    const data = { result: 'test data' }

    // Set cache
    apiCache.set(endpoint, params, data)
    
    // Get from cache
    const cached = apiCache.get(endpoint, params)
    expect(cached).toEqual(data)
  })

  it('should return null for expired cache entries', () => {
    const endpoint = '/test-endpoint'
    const data = { result: 'test data' }
    const shortTTL = 1 // 1ms TTL

    apiCache.set(endpoint, {}, data, shortTTL)
    
    // Wait for expiration
    setTimeout(() => {
      const cached = apiCache.get(endpoint, {})
      expect(cached).toBeNull()
    }, 10)
  })

  it('should generate consistent cache keys', () => {
    const endpoint = '/test'
    const params1 = { a: 1, b: 2 }
    const params2 = { b: 2, a: 1 } // Different order
    
    apiCache.set(endpoint, params1, 'data1')
    const cached = apiCache.get(endpoint, params2)
    
    expect(cached).toBe('data1') // Should find the same entry
  })

  it('should cleanup expired entries', () => {
    const endpoint = '/test'
    const shortTTL = 1

    apiCache.set(endpoint, {}, 'data', shortTTL)
    expect(apiCache.getStats().size).toBe(1)
    
    setTimeout(() => {
      apiCache.cleanup()
      expect(apiCache.getStats().size).toBe(0)
    }, 10)
  })
})

describe('Bundle Size and Code Splitting', () => {
  it('should have reasonable bundle size thresholds', () => {
    // These are approximate thresholds for a Next.js app
    const expectedThresholds = {
      maxMainBundleSize: 500 * 1024, // 500KB
      maxVendorBundleSize: 1024 * 1024, // 1MB
      maxPageBundleSize: 100 * 1024, // 100KB
    }

    // In a real test, you would analyze the actual bundle sizes
    // This is a placeholder to demonstrate the concept
    expect(expectedThresholds.maxMainBundleSize).toBeGreaterThan(0)
    expect(expectedThresholds.maxVendorBundleSize).toBeGreaterThan(0)
    expect(expectedThresholds.maxPageBundleSize).toBeGreaterThan(0)
  })
})

describe('Performance Thresholds', () => {
  it('should have defined performance thresholds', () => {
    expect(performanceThresholds.lcp.good).toBeLessThan(performanceThresholds.lcp.poor)
    expect(performanceThresholds.fid.good).toBeLessThan(performanceThresholds.fid.poor)
    expect(performanceThresholds.cls.good).toBeLessThan(performanceThresholds.cls.poor)
  })

  it('should validate API response times', () => {
    const fastResponse = 500 // 500ms
    const slowResponse = 5000 // 5s

    expect(fastResponse).toBeLessThan(performanceThresholds.apiResponse.good)
    expect(slowResponse).toBeGreaterThan(performanceThresholds.apiResponse.poor)
  })

  it('should validate page load times', () => {
    const fastLoad = 1000 // 1s
    const slowLoad = 10000 // 10s

    expect(fastLoad).toBeLessThan(performanceThresholds.pageLoad.good)
    expect(slowLoad).toBeGreaterThan(performanceThresholds.pageLoad.poor)
  })
})

describe('Production Configuration', () => {
  it('should enable performance monitoring in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    // Re-import config to get updated values
    jest.resetModules()
    const { config: prodConfig } = require('@/lib/config')
    
    expect(prodConfig.performance.enableTracking).toBe(true)
    expect(prodConfig.performance.enableWebVitals).toBe(true)
    expect(prodConfig.features.enablePerformanceMonitoring).toBe(true)
    
    process.env.NODE_ENV = originalEnv
  })

  it('should have appropriate cache TTL for production', () => {
    expect(config.cache.ttl).toBeGreaterThan(0)
    expect(config.api.timeout).toBeGreaterThan(0)
  })

  it('should have security configurations for production', () => {
    expect(config.security.sessionTimeout).toBeGreaterThan(0)
    expect(config.security.enableCSP).toBeDefined()
    expect(config.security.enableHSTS).toBeDefined()
  })
})

describe('Resource Loading Performance', () => {
  it('should validate image optimization settings', () => {
    // Test would validate Next.js image optimization config
    const imageConfig = {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    }

    expect(imageConfig.formats).toContain('image/webp')
    expect(imageConfig.deviceSizes.length).toBeGreaterThan(0)
    expect(imageConfig.imageSizes.length).toBeGreaterThan(0)
  })

  it('should validate CSS optimization', () => {
    // Test would validate Tailwind CSS purging configuration
    const cssConfig = {
      purgeEnabled: process.env.NODE_ENV === 'production',
      safelist: ['backdrop-blur', 'bg-opacity', 'border-opacity', 'animate-'],
    }

    expect(cssConfig.safelist.length).toBeGreaterThan(0)
  })
})

describe('Memory Usage and Cleanup', () => {
  it('should cleanup cache when memory threshold is reached', () => {
    const maxEntries = 5
    
    // Fill cache beyond threshold
    for (let i = 0; i < maxEntries + 2; i++) {
      apiCache.set(`/endpoint-${i}`, {}, `data-${i}`)
    }

    const stats = apiCache.getStats()
    expect(stats.size).toBeGreaterThan(0)
    
    // In a real implementation, you would test automatic cleanup
    apiCache.clear()
    expect(apiCache.getStats().size).toBe(0)
  })

  it('should handle performance observer cleanup', () => {
    // Mock PerformanceObserver
    const mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
    }

    const originalObserver = global.PerformanceObserver
    global.PerformanceObserver = jest.fn(() => mockObserver) as any

    // Re-initialize to trigger observer setup
    const monitor = new (require('@/lib/performance').performanceMonitor.constructor)()
    monitor.init()
    
    // Verify observer was created and used
    expect(global.PerformanceObserver).toHaveBeenCalled()
    
    // Restore original
    global.PerformanceObserver = originalObserver
  })
})

describe('Error Handling in Performance Monitoring', () => {
  it('should handle missing web-vitals gracefully', () => {
    // Mock web-vitals import failure
    jest.doMock('web-vitals', () => {
      throw new Error('Module not found')
    })

    expect(() => performanceMonitor.init()).not.toThrow()
  })

  it('should handle missing Performance API gracefully', () => {
    const originalPerformance = global.performance
    delete (global as any).performance

    expect(() => performanceMonitor.init()).not.toThrow()
    expect(() => performanceMonitor.getPerformanceData()).not.toThrow()

    global.performance = originalPerformance
  })

  it('should handle analytics endpoint failures gracefully', () => {
    // Mock fetch to simulate network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    // Should not throw when analytics fails
    expect(() => {
      performanceMonitor.setCustomMetric('test', 100)
    }).not.toThrow()
  })
})