'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassTextareaProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
  error?: boolean
  rows?: number
  maxLength?: number
  resize?: boolean
}

export function GlassTextarea({
  placeholder,
  value,
  onChange,
  className,
  disabled = false,
  required = false,
  autoFocus = false,
  onFocus,
  onBlur,
  error = false,
  rows = 4,
  maxLength,
  resize = true
}: GlassTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setHasValue(!!newValue)
    onChange?.(newValue)
  }

  const characterCount = value?.length || 0
  const isNearLimit = maxLength && characterCount > maxLength * 0.8

  return (
    <div className={cn(
      'relative group transition-all duration-300',
      className
    )}>
      {/* Background with glass effect */}
      <div className={cn(
        'absolute inset-0 rounded-xl backdrop-blur-md border transition-all duration-300',
        isFocused 
          ? 'bg-white/15 border-white/30 shadow-lg shadow-blue-500/20' 
          : 'bg-white/10 border-white/20',
        error && 'border-red-400/50 bg-red-500/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )} />

      {/* Glow effect on focus */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-sm -z-10 animate-pulse" />
      )}

      {/* Textarea container */}
      <div className="relative">
        {/* Floating label */}
        {placeholder && (isFocused || hasValue) && (
          <div className={cn(
            'absolute left-4 -top-2 px-2 text-xs font-medium transition-all duration-300 pointer-events-none z-10',
            'bg-gradient-to-r from-transparent via-black/20 to-transparent backdrop-blur-sm rounded',
            isFocused ? 'text-white scale-105' : 'text-white/70',
            error && 'text-red-400'
          )}>
            {placeholder}
          </div>
        )}

        {/* Textarea field */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            'w-full bg-transparent border-none outline-none text-white placeholder-white/50 transition-all duration-300',
            'px-4 py-3 text-sm font-medium leading-relaxed',
            isFocused && 'placeholder-white/70',
            error && 'text-red-100 placeholder-red-300/50',
            resize ? 'resize-y' : 'resize-none',
            'min-h-[100px]'
          )}
        />

        {/* Character counter */}
        {maxLength && (
          <div className={cn(
            'absolute bottom-2 right-3 text-xs transition-all duration-300',
            isNearLimit ? 'text-yellow-400' : 'text-white/50',
            characterCount >= maxLength && 'text-red-400',
            isFocused && 'text-white/70'
          )}>
            {characterCount}/{maxLength}
          </div>
        )}
      </div>

      {/* Animated border */}
      <div className={cn(
        'absolute bottom-0 left-1/2 transform -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-300',
        isFocused ? 'w-full via-blue-400/60' : 'w-0',
        error && 'via-red-400/60'
      )} />

      {/* Shimmer effect */}
      {isFocused && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
        </div>
      )}

      {/* Corner decorations */}
      <div className={cn(
        'absolute top-2 right-2 w-1 h-1 bg-gradient-to-br from-white/30 to-transparent rounded-full transition-opacity duration-300',
        isFocused ? 'opacity-100 animate-pulse' : 'opacity-0'
      )} />
      <div className={cn(
        'absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-tr from-white/30 to-transparent rounded-full transition-opacity duration-300',
        isFocused ? 'opacity-100 animate-pulse' : 'opacity-0'
      )} style={{ animationDelay: '0.5s' }} />
    </div>
  )
}