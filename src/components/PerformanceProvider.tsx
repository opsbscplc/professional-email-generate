'use client'

import { useEffect } from 'react'
import { performanceMonitor } from '@/lib/performance'

interface PerformanceProviderProps {
  children: React.ReactNode
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring on client side
    performanceMonitor.init()

    // Report performance data on page unload
    const handleBeforeUnload = () => {
      const report = performanceMonitor.generateReport()
      
      // Send final performance report
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', JSON.stringify({
          type: 'performance_report',
          data: report,
        }))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return <>{children}</>
}