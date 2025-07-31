import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { GlassButton } from './GlassButton'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: 'error' | 'warning' | 'info'
}

const variantStyles = {
  error: {
    border: 'border-red-400/50',
    bg: 'bg-red-500/10',
    icon: '❌',
    titleColor: 'text-red-400',
    textColor: 'text-red-300',
  },
  warning: {
    border: 'border-yellow-400/50',
    bg: 'bg-yellow-500/10',
    icon: '⚠️',
    titleColor: 'text-yellow-400',
    textColor: 'text-yellow-300',
  },
  info: {
    border: 'border-blue-400/50',
    bg: 'bg-blue-500/10',
    icon: 'ℹ️',
    titleColor: 'text-blue-400',
    textColor: 'text-blue-300',
  },
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  onDismiss,
  className,
  variant = 'error',
}: ErrorMessageProps) {
  const styles = variantStyles[variant]

  return (
    <GlassCard
      className={cn(
        'p-4 animate-slide-up',
        styles.border,
        styles.bg,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3">
        <span className="text-lg flex-shrink-0 mt-0.5">
          {styles.icon}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('font-semibold mb-1', styles.titleColor)}>
              {title}
            </h3>
          )}
          <p className={cn('text-sm leading-relaxed', styles.textColor)}>
            {message}
          </p>
          {(onRetry || onDismiss) && (
            <div className="flex items-center space-x-2 mt-3">
              {onRetry && (
                <GlassButton
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  Try Again
                </GlassButton>
              )}
              {onDismiss && (
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="text-xs"
                >
                  Dismiss
                </GlassButton>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}

export function ErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(new Error(event.message))
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true)
      setError(new Error(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <ErrorMessage
        title="Something went wrong"
        message={error?.message || 'An unexpected error occurred'}
        onRetry={() => {
          setHasError(false)
          setError(null)
        }}
      />
    )
  }

  return <>{children}</>
}