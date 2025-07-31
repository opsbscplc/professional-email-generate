/**
 * API Response Caching Utilities
 * Implements in-memory caching for API responses to improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generate cache key from request parameters
   */
  private generateKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Get cached response if available and valid
   */
  get<T>(endpoint: string, params: Record<string, any> = {}): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.data;
    }

    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Cache response data
   */
  set<T>(
    endpoint: string, 
    params: Record<string, any> = {}, 
    data: T, 
    ttl: number = this.defaultTTL
  ): void {
    const key = this.generateKey(endpoint, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear specific cache entry
   */
  delete(endpoint: string, params: Record<string, any> = {}): void {
    const key = this.generateKey(endpoint, params);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const apiCache = new APICache();

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Cache decorator for API functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  endpoint: string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const params = args.length > 0 ? { args } : {};
    
    // Try to get from cache first
    const cached = apiCache.get(endpoint, params);
    if (cached) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      apiCache.set(endpoint, params, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }) as T;
}