import React from 'react'
import { cn } from '@/lib/utils'
import { ValidationError } from '@/lib/error-handling'

interface ValidationFeedbackProps {
  errors: ValidationError[]
  field?: string
  className?: string
}

export function ValidationFeedback({
  errors,
  field,
  className,
}: ValidationFeedbackProps) {
  const fieldErrors = field 
    ? errors.filter(error => error.field === field)
    : errors

  if (fieldErrors.length === 0) return null

  return (
    <div className={cn('mt-1 space-y-1', className)}>
      {fieldErrors.map((error, index) => (
        <div
          key={index}
          className="flex items-start space-x-2 text-sm text-red-600 animate-slide-down"
        >
          <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  )
}

interface ValidatedInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  errors?: ValidationError[]
  field?: string
  className?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  required?: boolean
  label?: string
}

export function ValidatedInput({
  value,
  onChange,
  onBlur,
  placeholder,
  errors = [],
  field,
  className,
  disabled,
  maxLength,
  rows,
  required,
  label,
}: ValidatedInputProps) {
  const hasErrors = field ? errors.some(e => e.field === field) : errors.length > 0
  const Component = rows ? 'textarea' : 'input'

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <Component
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 rounded-xl border transition-all duration-200',
            'bg-white/50 backdrop-blur-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
            'placeholder:text-gray-400',
            hasErrors
              ? 'border-red-300 focus:border-red-500'
              : 'border-white/30 focus:border-blue-300',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        />
        
        {maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      <ValidationFeedback errors={errors} field={field} />
    </div>
  )
}

interface FormValidationSummaryProps {
  errors: ValidationError[]
  className?: string
}

export function FormValidationSummary({
  errors,
  className,
}: FormValidationSummaryProps) {
  if (errors.length === 0) return null

  return (
    <div className={cn(
      'p-4 rounded-xl border border-red-300 bg-red-50/50 backdrop-blur-sm',
      'animate-slide-down',
      className
    )}>
      <div className="flex items-start space-x-2">
        <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
        <div className="flex-1">
          <h4 className="font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="space-y-1 text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start space-x-1">
                <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationFn: (values: T) => ValidationError[]
) {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<ValidationError[]>([])
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>)

  const validate = React.useCallback(() => {
    const newErrors = validationFn(values)
    setErrors(newErrors)
    return newErrors.length === 0
  }, [values, validationFn])

  const setValue = React.useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldTouched = React.useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const getFieldErrors = React.useCallback((field: keyof T) => {
    return errors.filter(error => error.field === field)
  }, [errors])

  const isFieldValid = React.useCallback((field: keyof T) => {
    return !errors.some(error => error.field === field)
  }, [errors])

  const reset = React.useCallback(() => {
    setValues(initialValues)
    setErrors([])
    setTouched({} as Record<keyof T, boolean>)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched: setFieldTouched,
    validate,
    getFieldErrors,
    isFieldValid,
    reset,
    isValid: errors.length === 0,
  }
}