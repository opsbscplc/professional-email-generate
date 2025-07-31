/**
 * Performance Monitoring and Core Web Vitals Tracking
 * Implements client-side performance monitoring for production optimization
 */

// Core Web Vitals metrics
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Performance entry interface
export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
}

// Analytics data structure
export interface PerformanceData {
  url: string;
  timestamp: number;
  userAgent: string;
  connectionType?: string;
  metrics: {
    webVitals: WebVitalsMetric[];
    customMetrics: Record<string, number>;
    resourceTimings: PerformanceEntry[];
  };
}

class PerformanceMonitor {
  private metrics: WebVitalsMetric[] = [];
  private customMetrics: Record<string, number> = {};
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    this.isInitialized = true;
    this.setupWebVitalsTracking();
    this.setupCustomMetrics();
    this.setupResourceTimingTracking();
  }

  /**
   * Set up Core Web Vitals tracking
   */
  private setupWebVitalsTracking(): void {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));
    }).catch(() => {
      // Fallback if web-vitals is not available
      console.warn('Web Vitals library not available');
    });
  }

  /**
   * Handle Web Vitals metric
   */
  private handleMetric(metric: WebVitalsMetric): void {
    this.metrics.push(metric);
    
    // Send to analytics if metric is poor
    if (metric.rating === 'poor') {
      this.reportPoorMetric(metric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
    }
  }

  /**
   * Set up custom performance metrics
   */
  private setupCustomMetrics(): void {
    // Track page load time
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      this.setCustomMetric('pageLoadTime', pageLoadTime);
    }

    // Track DOM content loaded time
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const domLoadTime = performance.now();
        this.setCustomMetric('domContentLoaded', domLoadTime);
      });
    }

    // Track time to interactive
    this.trackTimeToInteractive();
  }

  /**
   * Track Time to Interactive (TTI)
   */
  private trackTimeToInteractive(): void {
    let ttiStartTime = performance.now();
    
    const checkInteractive = () => {
      if (document.readyState === 'complete') {
        const tti = performance.now() - ttiStartTime;
        this.setCustomMetric('timeToInteractive', tti);
      } else {
        requestAnimationFrame(checkInteractive);
      }
    };

    requestAnimationFrame(checkInteractive);
  }

  /**
   * Set up resource timing tracking
   */
  private setupResourceTimingTracking(): void {
    if (!window.PerformanceObserver) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 1000) { // Only track slow resources
          this.reportSlowResource(entry);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Set custom metric
   */
  setCustomMetric(name: string, value: number): void {
    this.customMetrics[name] = value;
  }

  /**
   * Get custom metric
   */
  getCustomMetric(name: string): number | undefined {
    return this.customMetrics[name];
  }

  /**
   * Report poor performing metric
   */
  private reportPoorMetric(metric: WebVitalsMetric): void {
    // Send to analytics endpoint
    this.sendAnalytics({
      type: 'poor_web_vital',
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
    });
  }

  /**
   * Report slow loading resource
   */
  private reportSlowResource(entry: PerformanceEntry): void {
    this.sendAnalytics({
      type: 'slow_resource',
      name: entry.name,
      duration: entry.duration,
      url: window.location.href,
    });
  }

  /**
   * Send analytics data
   */
  private sendAnalytics(data: any): void {
    if (typeof window === 'undefined') return;

    // Use sendBeacon for reliable delivery
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(data));
    } else {
      // Fallback to fetch
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {
        // Ignore errors for analytics
      });
    }
  }

  /**
   * Get all performance data
   */
  getPerformanceData(): PerformanceData {
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      connectionType: this.getConnectionType(),
      metrics: {
        webVitals: this.metrics,
        customMetrics: this.customMetrics,
        resourceTimings: this.getResourceTimings(),
      },
    };
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string | undefined {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || connection?.type;
    }
    return undefined;
  }

  /**
   * Get resource timing entries
   */
  private getResourceTimings(): PerformanceEntry[] {
    if (typeof window === 'undefined' || !window.performance || !window.performance.getEntriesByType) {
      return [];
    }

    try {
      return window.performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const data = this.getPerformanceData();
    const report = {
      summary: {
        url: data.url,
        timestamp: new Date(data.timestamp).toISOString(),
        connectionType: data.connectionType,
      },
      webVitals: data.metrics.webVitals.reduce((acc, metric) => {
        acc[metric.name] = {
          value: metric.value,
          rating: metric.rating,
        };
        return acc;
      }, {} as Record<string, any>),
      customMetrics: data.metrics.customMetrics,
      slowResources: data.metrics.resourceTimings
        .filter(entry => entry.duration > 1000)
        .map(entry => ({
          name: entry.name,
          duration: Math.round(entry.duration),
        })),
    };

    return JSON.stringify(report, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for measuring custom performance
export function measureAsync<T>(
  name: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  return asyncFn().finally(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.setCustomMetric(name, duration);
  });
}

export function measureSync<T>(name: string, syncFn: () => T): T {
  const startTime = performance.now();
  const result = syncFn();
  const duration = performance.now() - startTime;
  performanceMonitor.setCustomMetric(name, duration);
  return result;
}

// Hook for React components
export function usePerformanceTracking(componentName: string) {
  if (typeof window !== 'undefined') {
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      performanceMonitor.setCustomMetric(`${componentName}_render`, renderTime);
    };
  }
  
  return () => {};
}