'use client'

import React, { useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { EmailTemplate, GeminiRequest, GeminiResponse } from '@/types'
import { TemplateSelector } from '@/components/TemplateSelector'
import { EmailEditor, EmailComparison } from '@/components/EmailEditor'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { LoadingButton } from '@/components/ui/LoadingOverlay'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ValidationFeedback, FormValidationSummary } from '@/components/ui/ValidationFeedback'
import { ApiKeyInput } from '@/components/ApiKeyInput'
import { enhanceEmailWithTemplate, testApiKey } from '@/lib/gemini'
import { validateEmailInput, ValidationError, AppError, getErrorRecoveryActions } from '@/lib/error-handling'
import { useSubmissionPrevention } from '@/lib/request-deduplication'

interface TemplateState {
  selectedTemplate: EmailTemplate | null
  draftEmail: string
  enhancedEmail: string | null
  isLoading: boolean
  error: string | null
}

export default function TemplateEnhancerPage() {
  const { apiKey } = useApiKey()
  const [state, setState] = useState<TemplateState>({
    selectedTemplate: null,
    draftEmail: '',
    enhancedEmail: null,
    isLoading: false,
    error: null
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [lastError, setLastError] = useState<AppError | null>(null)
  const { isSubmitting, preventDoubleSubmission } = useSubmissionPrevention()
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [keyTestResult, setKeyTestResult] = useState<{ valid: boolean; error?: string } | null>(null)

  const canEnhance = apiKey && 
                    state.selectedTemplate && 
                    state.draftEmail.trim().length > 0 && 
                    !state.isLoading &&
                    !isSubmitting &&
                    validationErrors.length === 0

  const handleTemplateChange = (template: EmailTemplate) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      error: null
    }))
  }

  const handleDraftChange = (draft: string) => {
    setState(prev => ({
      ...prev,
      draftEmail: draft,
      error: null
    }))
  }

  const handleEnhanceEmail = async () => {
    if (!canEnhance) return

    // Validate input
    const inputErrors = validateEmailInput(state.draftEmail)
    if (inputErrors.length > 0) {
      setValidationErrors(inputErrors)
      return
    }

    try {
      await preventDoubleSubmission(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        setLastError(null)
        setValidationErrors([])

        const result = await enhanceEmailWithTemplate(
          apiKey!,
          state.draftEmail,
          state.selectedTemplate!
        )

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            enhancedEmail: result.data!,
            isLoading: false,
            error: null
          }))
        } else {
          throw new AppError(result.error || 'Failed to enhance email')
        }
      })
    } catch (error) {
      // Detailed error logging for debugging
      console.error('❌ Enhancement Error - Full Details:', {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof AppError ? error.code : undefined,
        errorStatus: error instanceof AppError ? error.status : undefined,
        userMessage: error instanceof AppError ? error.userMessage : undefined,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })

      const appError = error instanceof AppError ? error : new AppError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      )

      setLastError(appError)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError.userMessage
      }))
    }
  }

  const handleRetry = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const handleReset = () => {
    setState({
      selectedTemplate: null,
      draftEmail: '',
      enhancedEmail: null,
      isLoading: false,
      error: null
    })
    setValidationErrors([])
    setLastError(null)
  }

  const handleCopyEnhanced = () => {
    // Analytics or feedback could be added here
    console.log('Enhanced email copied to clipboard')
  }

  const handleTestApiKey = async () => {
    if (!apiKey) {
      setKeyTestResult({ valid: false, error: 'No API key found' })
      return
    }

    setIsTestingKey(true)
    setKeyTestResult(null)

    console.log('🔑 Testing API key...')
    const result = await testApiKey(apiKey)
    console.log('🔑 API key test result:', result)

    setKeyTestResult(result)
    setIsTestingKey(false)

    // Auto-dismiss success message after 3 seconds
    if (result.valid) {
      setTimeout(() => setKeyTestResult(null), 3000)
    }
  }

  if (!apiKey) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <GlassCard className="p-6 md:p-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Email Template Enhancer
            </h1>
            <p className="text-text-secondary mb-6">
              Please provide your Google Gemini API key to start enhancing your emails
            </p>
            <ApiKeyInput />
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            Email Template Enhancer
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-sm md:text-base">
            Select a template and enhance your email draft with AI-powered improvements
          </p>

          {/* API Key Test Button */}
          <div className="mt-4 flex justify-center">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleTestApiKey}
              disabled={isTestingKey || !apiKey}
              className="text-xs"
            >
              {isTestingKey ? '🔄 Testing API Key...' : '🔑 Test API Key'}
            </GlassButton>
          </div>

          {/* API Key Test Result */}
          {keyTestResult && (
            <div className="mt-3 flex justify-center">
              {keyTestResult.valid ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-400/30 rounded-lg">
                  <span className="text-green-400">✅</span>
                  <span className="text-sm text-green-300">API key is valid and working!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-400/30 rounded-lg max-w-md">
                  <span className="text-red-400">❌</span>
                  <span className="text-sm text-red-300">{keyTestResult.error || 'API key test failed'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Template Selection */}
          <GlassCard className="p-4 md:p-6">
            <TemplateSelector
              selectedTemplate={state.selectedTemplate}
              onTemplateChange={handleTemplateChange}
              disabled={state.isLoading}
            />
          </GlassCard>

          {/* Email Input */}
          <GlassCard className="p-4 md:p-6">
            <EmailEditor
              value={state.draftEmail}
              onChange={handleDraftChange}
              label="Your Email Draft"
              placeholder="Enter your email draft here. The AI will enhance it based on your selected template..."
              maxLength={3000}
              showValidation={true}
              validationErrors={validationErrors}
              onValidationChange={setValidationErrors}
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center space-x-4">
                {state.enhancedEmail && (
                  <GlassButton
                    variant="ghost"
                    onClick={handleReset}
                    disabled={state.isLoading || isSubmitting}
                    size="sm"
                  >
                    Start Over
                  </GlassButton>
                )}
              </div>
              
              <LoadingButton
                variant="primary"
                isLoading={state.isLoading || isSubmitting}
                onClick={handleEnhanceEmail}
                disabled={!canEnhance}
                loadingText="Enhancing..."
                className="w-full sm:w-auto"
              >
                Enhance Email
              </LoadingButton>
            </div>
          </GlassCard>

          {/* Error Display */}
          {lastError && (
            <>
              <ErrorMessage
                title="Enhancement Failed"
                message={lastError.userMessage}
                onRetry={lastError.code === 'NETWORK_ERROR' ? handleRetry : undefined}
                onDismiss={() => {
                  setLastError(null)
                  setState(prev => ({ ...prev, error: null }))
                }}
                variant="error"
              />

              {/* Development Mode - Detailed Error Info */}
              {process.env.NODE_ENV === 'development' && (
                <GlassCard className="p-4 border-2 border-red-500/30">
                  <div className="text-sm space-y-2">
                    <div className="font-bold text-red-400">🔍 Debug Information (Development Only)</div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                      <span className="text-text-secondary">Error Code:</span>
                      <span className="font-mono text-red-300">{lastError.code || 'N/A'}</span>

                      <span className="text-text-secondary">Status:</span>
                      <span className="font-mono text-red-300">{lastError.status || 'N/A'}</span>

                      <span className="text-text-secondary">Technical Message:</span>
                      <span className="font-mono text-red-300 break-all">{lastError.message}</span>

                      <span className="text-text-secondary">User Message:</span>
                      <span className="font-mono text-red-300 break-all">{lastError.userMessage}</span>
                    </div>
                    <div className="mt-3 p-2 bg-black/30 rounded text-xs">
                      <div className="text-yellow-400 mb-1">💡 Troubleshooting Steps:</div>
                      <ol className="list-decimal list-inside space-y-1 text-text-secondary">
                        <li>Check browser console (F12) for detailed error logs</li>
                        <li>Check Network tab for /api/gemini request details</li>
                        <li>Verify API key is valid (starts with "AI", 20-50 chars)</li>
                        <li>Test API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 underline">Google AI Studio</a></li>
                      </ol>
                    </div>
                  </div>
                </GlassCard>
              )}
            </>
          )}
          
          {/* Validation Summary */}
          {validationErrors.length > 0 && (
            <FormValidationSummary errors={validationErrors} />
          )}

          {/* Results */}
          {state.enhancedEmail && (
            <GlassCard className="p-4 md:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Enhancement Results
                </h3>
                <p className="text-sm text-text-secondary">
                  Your email has been enhanced using the{' '}
                  <span className="font-medium text-accent-primary">
                    {state.selectedTemplate}
                  </span>{' '}
                  template
                </p>
              </div>
              
              <EmailComparison
                originalEmail={state.draftEmail}
                enhancedEmail={state.enhancedEmail}
                onCopyEnhanced={handleCopyEnhanced}
              />
            </GlassCard>
          )}
        </div>
      </div>
      
      {/* Global Loading Overlay */}
      <LoadingOverlay
        isVisible={state.isLoading || isSubmitting}
        message="Enhancing your email..."
        onCancel={() => {
          setState(prev => ({ ...prev, isLoading: false }))
        }}
      />
    </div>
  )
}