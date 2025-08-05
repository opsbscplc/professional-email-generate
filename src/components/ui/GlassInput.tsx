'use client'

import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassInputProps {
  type?: 'text' | 'email' | 'password' | 'url'
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
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function GlassInput({
  type = 'text',
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
  icon,
  rightIcon
}: GlassInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!value)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFocus = () => {
    setIsFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setHasValue(!!newValue)
    onChange?.(newValue)
  }

  return (
    <div className={cn(
      'relative group transition-all duration-300',
      className
    )}>
      {/* Background with glass effect */}
      <div className={cn(
        'absolute inset-0 rounded-xl backdrop-blur-md border transition-all duration-300',
        'bg-white/15 border-white/30 shadow-lg shadow-blue-500/20',
        error && 'border-red-400/50 bg-red-500/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )} />

      {/* Always visible glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-sm -z-10 animate-pulse" />

      {/* Input container */}
      <div className="relative flex items-center">
        {/* Left Icon */}
        {icon && (
          <div className={cn(
            'absolute left-4 z-10 transition-all duration-300',
            'text-white scale-110 animate-pulse-slow',
            error && 'text-red-400'
          )}>
            {icon}
          </div>
        )}

        {/* Right Icon */}
        {rightIcon && (
          <div className={cn(
            'absolute right-4 z-10 transition-all duration-300',
            'text-white scale-110 animate-pulse-slow',
            error && 'text-red-400'
          )}>
            {rightIcon}
          </div>
        )}

        {/* Input field */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            'w-full bg-transparent border-none outline-none text-white placeholder-white/70 transition-all duration-300',
            'px-4 py-3 text-sm font-medium',
            icon ? 'pl-12' : 'pl-4',
            rightIcon ? 'pr-12' : 'pr-4',
            error && 'text-red-100 placeholder-red-300/50'
          )}
        />

        {/* Always visible floating label effect */}
        {placeholder && (
          <div className={cn(
            'absolute left-4 -top-2 px-2 text-xs font-medium transition-all duration-300 pointer-events-none',
            'bg-gradient-to-r from-transparent via-black/20 to-transparent backdrop-blur-sm rounded',
            'text-white scale-105 animate-pulse-slow',
            error && 'text-red-400',
            icon && 'left-12'
          )}>
            {placeholder}
          </div>
        )}
      </div>

      {/* Always visible animated border */}
      <div className={cn(
        'absolute bottom-0 left-1/2 transform -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent transition-all duration-300',
        'w-full animate-shimmer',
        error && 'via-red-400/60'
      )} />

      {/* Always visible shimmer effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shimmer" />
      </div>
    </div>
  )
}