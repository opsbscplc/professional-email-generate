import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { EmailEditor } from '@/components/EmailEditor'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ValidationFeedback, FormValidationSummary } from '@/components/ui/ValidationFeedback'
import { LoadingButton } from '@/components/ui/LoadingOverlay'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { TrainerState, GeminiRequest, GeminiResponse } from '@/types'
import { validateTrainingDataClient, generateEmailWithTraining } from '@/lib/gemini'
import { validateTrainingData, validateEmailInput, ValidationError, getErrorRecoveryActions, AppError } from '@/lib/error-handling'
import { useSubmissionPrevention } from '@/lib/request-deduplication'

interface TrainerInterfaceProps {
  className?: string
}

interface ValidationErrors {
  trainingInput?: string
  trainingOutput?: string
  testInput?: string
}

const TRAINING_STEPS = [
  {
    id: 'training',
    title: 'Step 1: Provide Training Examples',
    description: 'Enter an input email and the desired output to train the AI on your communication style.'
  },
  {
    id: 'testing',
    title: 'Step 2: Test with New Input',
    description: 'Enter a new email that you want the AI to transform using the learned pattern.'
  },
  {
    id: 'results',
    title: 'Step 3: Review Generated Output',
    description: 'Review the AI-generated email based on your training examples.'
  }
]

export function TrainerInterface({ className }: TrainerInterfaceProps) {
  const { apiKey } = useApiKey()
  const [currentStep, setCurrentStep] = useState<'training' | 'testing' | 'results'>('training')
  const [state, setState] = useState<TrainerState>({
    trainingInput: '',
    trainingOutput: '',
    testInput: '',
    generatedOutput: null,
    isLoading: false,
    error: null
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [lastError, setLastError] = useState<AppError | null>(null)
  const { isSubmitting, preventDoubleSubmission } = useSubmissionPrevention()

  const validateCurrentStep = (): boolean => {
    let errors: ValidationError[] = []
    
    if (currentStep === 'training') {
      errors = validateTrainingData(state.trainingInput, state.trainingOutput)
    } else if (currentStep === 'testing') {
      const trainingErrors = validateTrainingData(state.trainingInput, state.trainingOutput)
      const testErrors = validateEmailInput(state.testInput).map(e => ({ ...e, field: 'testInput' }))
      errors = [...trainingErrors, ...testErrors]
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleProceedToTesting = () => {
    if (validateCurrentStep()) {
      setCurrentStep('testing')
      setState(prev => ({ ...prev, error: null }))
      setLastError(null)
    }
  }

  const handleGenerateOutput = async () => {
    if (!validateCurrentStep()) return
    if (!apiKey) {
      const error = new AppError('API key is required', 'Please enter your API key to continue', 'INVALID_API_KEY')
      setLastError(error)
      setState(prev => ({ ...prev, error: error.userMessage }))
      return
    }

    try {
      await preventDoubleSubmission(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))
        setLastError(null)

        const result = await generateEmailWithTraining(
          apiKey,
          state.testInput,
          {
            input: state.trainingInput,
            output: state.trainingOutput
          }
        )

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            generatedOutput: result.data!,
            isLoading: false,
            error: null
          }))
          setCurrentStep('results')
        } else {
          throw new AppError(result.error || 'Failed to generate output')
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

  const handleReset = () => {
    setState({
      trainingInput: '',
      trainingOutput: '',
      testInput: '',
      generatedOutput: null,
      isLoading: false,
      error: null
    })
    setValidationErrors([])
    setLastError(null)
    setCurrentStep('training')
  }

  const handleBackToTesting = () => {
    setCurrentStep('testing')
    setState(prev => ({ ...prev, error: null }))
  }

  const handleCopyGenerated = () => {
    // Copy callback - could be used for analytics
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Indicator */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">
            AI Trainer - Learn Your Communication Style
          </h2>
          
          <div className="flex items-center space-x-4">
            {TRAINING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentStep === step.id || 
                  (step.id === 'testing' && currentStep === 'results') ||
                  (step.id === 'training' && (currentStep === 'testing' || currentStep === 'results'))
                    ? 'bg-accent-primary text-white' 
                    : 'bg-white/20 text-text-secondary'
                )}>
                  {index + 1}
                </div>
                {index < TRAINING_STEPS.length - 1 && (
                  <div className={cn(
                    'w-12 h-0.5 mx-2 transition-colors',
                    (currentStep === 'testing' && index === 0) || 
                    (currentStep === 'results' && index <= 1)
                      ? 'bg-accent-primary' 
                      : 'bg-white/20'
                  )} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-text-secondary">
            {TRAINING_STEPS.find(step => step.id === currentStep)?.description}
          </div>
        </div>
      </GlassCard>

      {/* Error Display */}
      {lastError && (
        <ErrorMessage 
          title="Error"
          message={lastError.userMessage}
          onRetry={lastError.code === 'NETWORK_ERROR' ? () => {
            setLastError(null)
            setState(prev => ({ ...prev, error: null }))
          } : undefined}
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

      {/* Step 1: Training Data Input */}
      {currentStep === 'training' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Training Examples
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Provide an example of an input email and how you would like it to be transformed. 
                The AI will learn from this pattern to apply similar transformations to new emails.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <EmailEditor
                  value={state.trainingInput}
                  onChange={(value) => setState(prev => ({ ...prev, trainingInput: value }))}
                  placeholder="Enter the original email that needs improvement..."
                  label="Training Input Email"
                  maxLength={2000}
                  showValidation={true}
                  validationErrors={validationErrors}
                  onValidationChange={(errors) => {
                    const otherErrors = validationErrors.filter(e => e.field !== 'trainingInput')
                    setValidationErrors([...otherErrors, ...errors.map(e => ({ ...e, field: 'trainingInput' }))])
                  }}
                />
              </div>

              <div>
                <EmailEditor
                  value={state.trainingOutput}
                  onChange={(value) => setState(prev => ({ ...prev, trainingOutput: value }))}
                  placeholder="Enter how you want the email to be improved..."
                  label="Training Output Email"
                  maxLength={2000}
                  showValidation={true}
                  validationErrors={validationErrors}
                  onValidationChange={(errors) => {
                    const otherErrors = validationErrors.filter(e => e.field !== 'trainingOutput')
                    setValidationErrors([...otherErrors, ...errors.map(e => ({ ...e, field: 'trainingOutput' }))])
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <GlassButton
                variant="primary"
                onClick={handleProceedToTesting}
                disabled={!state.trainingInput.trim() || !state.trainingOutput.trim()}
              >
                Continue to Testing
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Test Input */}
      {currentStep === 'testing' && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Test with New Email
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Enter a new email that you want the AI to transform using the pattern learned from your training examples.
              </p>
            </div>

            <EmailEditor
              value={state.testInput}
              onChange={(value) => setState(prev => ({ ...prev, testInput: value }))}
              placeholder="Enter the email you want to transform..."
              label="Email to Transform"
              maxLength={2000}
              showValidation={true}
              validationErrors={validationErrors}
              onValidationChange={(errors) => {
                const otherErrors = validationErrors.filter(e => e.field !== 'testInput')
                setValidationErrors([...otherErrors, ...errors.map(e => ({ ...e, field: 'testInput' }))])
              }}
            />

            <div className="flex justify-between">
              <GlassButton
                variant="outline"
                onClick={() => setCurrentStep('training')}
              >
                Back to Training
              </GlassButton>
              
              <LoadingButton
                variant="primary"
                isLoading={state.isLoading || isSubmitting}
                onClick={handleGenerateOutput}
                disabled={!state.testInput.trim() || !apiKey || validationErrors.length > 0}
                loadingText="Generating..."
              >
                Generate Output
              </LoadingButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Results */}
      {currentStep === 'results' && state.generatedOutput && (
        <GlassCard className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Generated Output
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Here's the AI-generated email based on your training pattern:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmailEditor
                value={state.testInput}
                readOnly
                label="Your Input"
                showCopyButton
              />

              <EmailEditor
                value={state.generatedOutput}
                readOnly
                label="AI Generated Output"
                showCopyButton
                onCopy={handleCopyGenerated}
              />
            </div>

            <div className="flex justify-between">
              <GlassButton
                variant="outline"
                onClick={handleBackToTesting}
              >
                Try Another Email
              </GlassButton>
              
              <GlassButton
                variant="ghost"
                onClick={handleReset}
              >
                Start Over
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Guidance Card */}
      <GlassCard className="p-6">
        <div className="space-y-3">
          <h4 className="font-medium text-text-primary">Tips for Better Results</h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• Provide clear, specific examples in your training data</li>
            <li>• Make sure your training input and output show a clear transformation pattern</li>
            <li>• Use complete sentences and proper email structure</li>
            <li>• The more detailed your training examples, the better the AI will understand your style</li>
          </ul>
        </div>
      </GlassCard>
    </div>
  )
}