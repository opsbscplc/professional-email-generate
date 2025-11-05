import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  progress?: number
  onCancel?: () => void
  className?: string
}

export function LoadingOverlay({
  isVisible,
  message = 'Processing...',
  progress,
  onCancel,
  className,
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-black/20 backdrop-blur-sm',
      'animate-fade-in',
      className
    )}>
      <GlassCard className="p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="relative mx-auto mb-4 w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          </div>
          
          {/* Message */}
          <p className="text-gray-700 font-medium mb-4">{message}</p>
          
          {/* Progress bar */}
          {typeof progress === 'number' && (
            <div className="mb-4">
              <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">{Math.round(progress)}%</p>
            </div>
          )}
          
          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export function InlineLoading({
  size = 'md',
  message,
  className,
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full border-2 border-blue-200/30"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
      </div>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  )
}

interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export function LoadingButton({
  isLoading,
  children,
  loadingText,
  disabled,
  onClick,
  className,
  variant = 'primary',
}: LoadingButtonProps) {
  const baseClasses = 'relative px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(baseClasses, variantClasses[variant], className)}
    >
      <span className={cn('flex items-center justify-center space-x-2', {
        'opacity-0': isLoading
      })}>
        {children}
      </span>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 relative">
              <div className="absolute inset-0 rounded-full border-2 border-white/30"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
            </div>
            {loadingText && (
              <span className="text-sm">{loadingText}</span>
            )}
          </div>
        </div>
      )}
    </button>
  )
}