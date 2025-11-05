import React from 'react'
import { cn } from '@/lib/utils'

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary: 'bg-accent-primary/80 hover:bg-accent-primary text-white border-accent-primary/30',
  secondary: 'bg-accent-secondary/80 hover:bg-accent-secondary text-white border-accent-secondary/30',
  ghost: 'bg-white/10 hover:bg-white/20 text-text-primary border-white/20',
  outline: 'bg-transparent hover:bg-white/10 text-text-primary border-white/40',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function GlassButton({
  children,
  className,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg backdrop-blur-md border transition-all duration-200 font-medium',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-95',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}