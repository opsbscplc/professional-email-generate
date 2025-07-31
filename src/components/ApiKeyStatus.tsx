'use client'

import React, { useState } from 'react'
import { GlassButton, GlassCard } from '@/components/ui'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { ApiKeyInput } from './ApiKeyInput'

interface ApiKeyStatusProps {
  className?: string
  showFullInput?: boolean
}

export function ApiKeyStatus({ className, showFullInput = false }: ApiKeyStatusProps) {
  const { apiKey, isValid, clearApiKey } = useApiKey()
  const [showInput, setShowInput] = useState(showFullInput)

  const handleToggleInput = () => {
    setShowInput(!showInput)
  }

  const handleKeyValidated = () => {
    if (!showFullInput) {
      setShowInput(false)
    }
  }

  if (showInput) {
    return (
      <div className={className}>
        <GlassCard className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary">API Key Setup</h3>
            {!showFullInput && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setShowInput(false)}
              >
                ✕
              </GlassButton>
            )}
          </div>
          <ApiKeyInput onValidKey={handleKeyValidated} />
        </GlassCard>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {/* API Key Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isValid ? 'bg-green-400' : 'bg-red-400'
            }`}
            title={isValid ? 'API key is valid' : 'API key required'}
          />
          <span className="text-sm text-text-secondary">
            {isValid ? 'API Connected' : 'API Required'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleToggleInput}
                title="Update API key"
              >
                🔑
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={clearApiKey}
                title="Clear API key"
              >
                🗑️
              </GlassButton>
            </>
          ) : (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleToggleInput}
            >
              Add API Key
            </GlassButton>
          )}
        </div>
      </div>

      {/* Masked API Key Display */}
      {isValid && apiKey && (
        <div className="mt-2 text-xs text-text-secondary font-mono">
          {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)}
        </div>
      )}
    </div>
  )
}

export function ApiKeyGuard({ children }: { children: React.ReactNode }) {
  const { isValid } = useApiKey()

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <GlassCard className="p-6 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              API Key Required
            </h2>
            <p className="text-text-secondary mb-6">
              Please enter your Google Gemini API key to use the email template generator.
            </p>
            <ApiKeyStatus showFullInput />
          </GlassCard>
        </div>
      </div>
    )
  }

  return <>{children}</>
}