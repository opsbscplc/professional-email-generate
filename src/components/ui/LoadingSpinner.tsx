'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'gradient'
  className?: string
  text?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="loading-dots">
          <span className={cn('bg-white', sizeClasses[size])} />
          <span className={cn('bg-white', sizeClasses[size])} />
          <span className={cn('bg-white', sizeClasses[size])} />
        </div>
        {text && (
          <div className={cn('text-white/70 font-medium', textSizeClasses[size])}>
            {text}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className={cn(
          'rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse',
          sizeClasses[size]
        )} />
        {text && (
          <div className={cn('text-white/70 font-medium', textSizeClasses[size])}>
            {text}
          </div>
        )}
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className={cn(
          'rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin',
          sizeClasses[size]
        )}>
          <div className={cn(
            'rounded-full bg-black/20 backdrop-blur-sm',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-11 h-11'
          )} />
        </div>
        {text && (
          <div className={cn('text-white/70 font-medium', textSizeClasses[size])}>
            {text}
          </div>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-white/20 border-t-white',
        sizeClasses[size]
      )} />
      {text && (
        <div className={cn('text-white/70 font-medium', textSizeClasses[size])}>
          {text}
        </div>
      )}
    </div>
  )
}

// Inline loading component for buttons
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('loading-dots', className)}>
      <span className="w-1 h-1 bg-current rounded-full" />
      <span className="w-1 h-1 bg-current rounded-full" />
      <span className="w-1 h-1 bg-current rounded-full" />
    </div>
  )
}