import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative" role="status" aria-label="Loading">
        {/* Outer ring */}
        <div
          className={cn(
            'border-4 border-white/20 rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        {/* Inner spinning ring */}
        <div
          className={cn(
            'absolute top-0 left-0 border-4 border-transparent border-t-accent-primary rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        {/* Glass effect overlay */}
        <div
          className={cn(
            'absolute top-1 left-1 border-2 border-white/40 rounded-full glass-shimmer',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-6 h-6',
            size === 'xl' && 'w-10 h-10'
          )}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-text-secondary animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingOverlay({ children, loading, text }: {
  children: React.ReactNode
  loading: boolean
  text?: string
}) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <LoadingSpinner size="lg" text={text} />
        </div>
      )}
    </div>
  )
}