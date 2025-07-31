import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { copyToClipboard } from '@/lib/utils'
import { ValidationFeedback } from '@/components/ui/ValidationFeedback'
import { validateEmailInput, ValidationError } from '@/lib/error-handling'

interface EmailEditorProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  label?: string
  maxLength?: number
  showCopyButton?: boolean
  onCopy?: () => void
  showValidation?: boolean
  validationErrors?: ValidationError[]
  onValidationChange?: (errors: ValidationError[]) => void
}

export function EmailEditor({
  value,
  onChange,
  placeholder = 'Enter your email draft here...',
  readOnly = false,
  className,
  label,
  maxLength = 5000,
  showCopyButton = false,
  onCopy,
  showValidation = false,
  validationErrors = [],
  onValidationChange
}: EmailEditorProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaId = React.useId()

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`
    }
  }, [value])

  const handleCopy = async () => {
    if (!value.trim()) return

    try {
      await copyToClipboard(value)
      setIsCopied(true)
      setCopyError(null)
      onCopy?.()
      
      // Reset copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      setCopyError('Failed to copy to clipboard')
      setTimeout(() => setCopyError(null), 3000)
    }
  }

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isOverLimit = characterCount > maxLength

  // Validation
  const [localValidationErrors, setLocalValidationErrors] = useState<ValidationError[]>([])
  const currentErrors = validationErrors.length > 0 ? validationErrors : localValidationErrors
  const hasErrors = currentErrors.length > 0

  React.useEffect(() => {
    if (showValidation && !readOnly) {
      const errors = validateEmailInput(value)
      setLocalValidationErrors(errors)
      onValidationChange?.(errors)
    }
  }, [value, showValidation, readOnly, onValidationChange])

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
          {showCopyButton && value.trim() && (
            <GlassButton
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={!value.trim()}
              className="text-xs"
            >
              {isCopied ? (
                <>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </GlassButton>
          )}
        </div>
      )}
      
      <GlassCard className={cn(
        'p-4',
        hasErrors && 'border-red-300/50 bg-red-50/10'
      )}>
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={maxLength}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-none',
            'text-text-primary placeholder-text-secondary/60',
            'min-h-[120px] leading-relaxed',
            readOnly && 'cursor-default'
          )}
          style={{ 
            fontFamily: 'inherit',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        />
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center space-x-4">
            {copyError && (
              <span className="text-xs text-red-400">
                {copyError}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-xs">
            <span className={cn(
              'transition-colors',
              isOverLimit ? 'text-red-400' : 
              isNearLimit ? 'text-yellow-400' : 
              'text-text-secondary'
            )}>
              {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
            </span>
            {isOverLimit && (
              <span className="text-red-400">
                Limit exceeded
              </span>
            )}
          </div>
        </div>
      </GlassCard>
      
      {showValidation && (
        <ValidationFeedback errors={currentErrors} field="email" />
      )}
    </div>
  )
}

interface EmailComparisonProps {
  originalEmail: string
  enhancedEmail: string
  onCopyOriginal?: () => void
  onCopyEnhanced?: () => void
  className?: string
}

export function EmailComparison({
  originalEmail,
  enhancedEmail,
  onCopyOriginal,
  onCopyEnhanced,
  className
}: EmailComparisonProps) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      <EmailEditor
        value={originalEmail}
        readOnly
        label="Original Draft"
        showCopyButton
        onCopy={onCopyOriginal}
        className="lg:max-w-none"
      />
      
      <EmailEditor
        value={enhancedEmail}
        readOnly
        label="Enhanced Email"
        showCopyButton
        onCopy={onCopyEnhanced}
        className="lg:max-w-none"
      />
    </div>
  )
}