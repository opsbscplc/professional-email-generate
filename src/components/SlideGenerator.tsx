'use client'

import React, { useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { SlideTheme, SlidePresentation, SlideGeneratorState } from '@/types'
import { GlassCard, GlassButton, GlassInput } from '@/components/ui'
import { ThemeSelector } from '@/components/ThemeSelector'
import { SlideViewer } from '@/components/SlideViewer'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

export function SlideGenerator() {
  const { apiKey } = useApiKey()
  const [state, setState] = useState<SlideGeneratorState>({
    topic: '',
    selectedTheme: SlideTheme.MODERN,
    presentation: null,
    isGenerating: false,
    currentSlideIndex: 0,
    error: null,
    generationProgress: 0
  })

  const handleTopicChange = (value: string) => {
    setState(prev => ({ ...prev, topic: value, error: null }))
  }

  const handleThemeSelect = (theme: SlideTheme) => {
    setState(prev => ({ ...prev, selectedTheme: theme }))
  }

  const generateSlides = async () => {
    if (!state.topic.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a topic for your presentation' }))
      return
    }

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      generationProgress: 0,
      presentation: null 
    }))

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          generationProgress: Math.min(prev.generationProgress + 5, 90)
        }))
      }, 500)

      const response = await fetch('/api/slides/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: state.topic.trim(),
          theme: state.selectedTheme,
          apiKey
        })
      })

      clearInterval(progressInterval)

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate slides')
      }

      setState(prev => ({
        ...prev,
        presentation: result.data,
        generationProgress: 100,
        currentSlideIndex: 0
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate slides'
      }))
    } finally {
      setState(prev => ({ ...prev, isGenerating: false, generationProgress: 0 }))
    }
  }

  const handleSlideNavigation = (index: number) => {
    setState(prev => ({ ...prev, currentSlideIndex: index }))
  }

  const resetGenerator = () => {
    setState({
      topic: '',
      selectedTheme: SlideTheme.MODERN,
      presentation: null,
      isGenerating: false,
      currentSlideIndex: 0,
      error: null,
      generationProgress: 0
    })
  }

  if (state.presentation) {
    return (
      <SlideViewer
        presentation={state.presentation}
        currentSlideIndex={state.currentSlideIndex}
        onSlideNavigation={handleSlideNavigation}
        onReset={resetGenerator}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Topic Input Section */}
      <GlassCard className="p-6 md:p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#1877F2' }}>
              What's your presentation topic?
            </h2>
            <p className="text-sm" style={{ color: '#42A5F5' }}>
              Enter a topic and we'll create 20 professional slides with speaker notes
            </p>
          </div>

          <div className="space-y-4">
            <GlassInput
              type="text"
              placeholder="e.g., Digital Marketing Strategies, Climate Change Solutions, AI in Healthcare..."
              value={state.topic}
              onChange={handleTopicChange}
              disabled={state.isGenerating}
              className="text-lg py-4"
            />

            <div className="text-xs text-center" style={{ color: '#42A5F5' }}>
              💡 Tip: Be specific for better results. Instead of "Marketing", try "Social Media Marketing for Small Businesses"
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Theme Selection */}
      <ThemeSelector
        selectedTheme={state.selectedTheme}
        onThemeSelect={handleThemeSelect}
        disabled={state.isGenerating}
      />

      {/* Generate Button */}
      <div className="text-center">
        <GlassButton
          onClick={generateSlides}
          disabled={!state.topic.trim() || state.isGenerating}
          loading={state.isGenerating}
          variant="primary"
          size="lg"
          className="px-12 py-4 text-lg font-semibold"
        >
          {state.isGenerating ? 'Generating Slides...' : '🎨 Generate Presentation'}
        </GlassButton>

        {state.isGenerating && (
          <div className="mt-4 space-y-2">
            <div className="text-sm" style={{ color: '#42A5F5' }}>
              Creating your presentation... {state.generationProgress}%
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${state.generationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {state.error && (
        <ErrorMessage
          message={state.error}
          variant="error"
          onDismiss={() => setState(prev => ({ ...prev, error: null }))}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={state.isGenerating}
        message="AI is crafting your presentation slides... This may take a few moments"
      />
    </div>
  )
}