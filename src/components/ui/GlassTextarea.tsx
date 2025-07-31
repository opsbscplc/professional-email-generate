import React from 'react'
import { cn } from '@/lib/utils'

interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  showCount?: boolean
  maxLength?: number
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, label, error, showCount, maxLength, value, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0)
    const textareaId = React.useId()

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex justify-between items-center">
            <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">
              {label}
            </label>
            {showCount && (
              <span className="text-xs text-text-secondary">
                {charCount}{maxLength && `/${maxLength}`}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(
              'w-full px-4 py-3 rounded-lg backdrop-blur-md border transition-all duration-200 resize-none',
              'bg-white/10 border-white/30 text-text-primary placeholder-text-secondary/70',
              'focus:bg-white/20 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[100px]',
              error && 'border-red-400/50 focus:border-red-400/70 focus:ring-red-400/20',
              className
            )}
            ref={ref}
            value={value}
            maxLength={maxLength}
            onChange={(e) => {
              setCharCount(e.target.value.length)
              props.onChange?.(e)
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 animate-slide-up">
            {error}
          </p>
        )}
      </div>
    )
  }
)

GlassTextarea.displayName = 'GlassTextarea'