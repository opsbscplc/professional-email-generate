import React from 'react'
import { cn } from '@/lib/utils'

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  opacity?: 'low' | 'medium' | 'high'
  rightIcon?: React.ReactNode
}

const blurClasses = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
  '3xl': 'backdrop-blur-3xl',
}

const opacityClasses = {
  low: 'bg-white/5',
  medium: 'bg-white/10',
  high: 'bg-white/20',
}

export function GlassInput({
  label,
  error,
  className,
  blur = 'md',
  opacity = 'medium',
  rightIcon,
  id,
  ...props
}: GlassInputProps) {
  const inputId = id || `glass-input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            'w-full px-4 py-3 rounded-lg border border-white/20 shadow-lg transition-all duration-300',
            'text-text-primary placeholder-text-secondary/60',
            'focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            blurClasses[blur],
            opacityClasses[opacity],
            error && 'border-red-400 focus:ring-red-400/50',
            rightIcon && 'pr-12',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}