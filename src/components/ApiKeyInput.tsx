'use client'

import React, { useState } from 'react'
import { GlassInput, GlassButton, ErrorMessage } from '@/components/ui'
import { validateApiKey } from '@/lib/utils'
import { useApiKey } from '@/contexts/ApiKeyContext'

interface ApiKeyInputProps {
  onValidKey?: (key: string) => void
  className?: string
}

export function ApiKeyInput({ onValidKey, className }: ApiKeyInputProps) {
  const { apiKey, setApiKey, clearApiKey, isValid } = useApiKey()
  const [inputValue, setInputValue] = useState(apiKey || '')
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleValidation = async () => {
    if (!inputValue.trim()) {
      setError('API key is required')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      // Basic format validation
      if (!validateApiKey(inputValue.trim())) {
        throw new Error('Invalid API key format. Google Gemini API keys should start with "AI" and be at least 20 characters long.')
      }

      // Test the API key with a simple request
      const testResponse = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: inputValue.trim() }),
      })

      if (!testResponse.ok) {
        const errorData = await testResponse.json()
        throw new Error(errorData.error || 'API key validation failed')
      }

      // If validation passes, store the key
      setApiKey(inputValue.trim())
      onValidKey?.(inputValue.trim())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate API key')
    } finally {
      setIsValidating(false)
    }
  }

  const handleClear = () => {
    setInputValue('')
    clearApiKey()
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (error) setError(null) // Clear error when user starts typing
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Google Gemini API Key
          </h3>
          <p className="text-sm text-text-secondary">
            Enter your Google Gemini API key to enable AI-powered email enhancement
          </p>
        </div>

        <div className="relative">
          <GlassInput
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter your Google Gemini API key..."
            error={error || undefined}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </button>
            }
            disabled={isValidating}
          />
        </div>

        <div className="flex gap-2">
          <GlassButton
            onClick={handleValidation}
            loading={isValidating}
            variant="primary"
            className="flex-1"
            disabled={!inputValue.trim() || isValidating}
          >
            {isValid && apiKey === inputValue.trim() ? 'Update Key' : 'Validate Key'}
          </GlassButton>
          
          {(inputValue || apiKey) && (
            <GlassButton
              onClick={handleClear}
              variant="outline"
              disabled={isValidating}
            >
              Clear
            </GlassButton>
          )}
        </div>

        {isValid && apiKey && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-400/30 rounded-lg">
              <span className="text-green-400">✅</span>
              <span className="text-sm text-green-300">API key validated successfully</span>
            </div>
          </div>
        )}

        {error && (
          <ErrorMessage
            message={error}
            variant="error"
            onDismiss={() => setError(null)}
          />
        )}

        <div className="text-xs text-text-secondary space-y-1">
          <p>• Your API key is stored securely in your browser session only</p>
          <p>• Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Google AI Studio</a></p>
          <p>• Your key will be cleared when you close the browser</p>
        </div>
      </div>
    </div>
  )
}