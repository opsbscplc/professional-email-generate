import React from 'react'
import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  opacity?: 'low' | 'medium' | 'high'
  hover?: boolean
  onClick?: () => void
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

export function GlassCard({
  children,
  className,
  blur = 'xl',
  opacity = 'medium',
  hover = false,
  onClick,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/20 shadow-lg transition-all duration-300',
        blurClasses[blur],
        opacityClasses[opacity],
        hover && 'hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:scale-[1.02]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}