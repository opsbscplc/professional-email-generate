'use client'

import React, { useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { EmailTemplate, GeminiRequest, GeminiResponse } from '@/types/gemini'
import { TemplateSelector } from '@/components/TemplateSelector'
import { EmailEditor, EmailComparison } from '@/components/EmailEditor'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { LoadingButton } from '@/components/ui/LoadingOverlay'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ValidationFeedback, FormValidationSummary } from '@/components/ui/ValidationFeedback'
import { ApiKeyInput } from '@/components/ApiKeyInput'
import { enhanceEmailWithTemplate } from '@/lib/gemini'
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