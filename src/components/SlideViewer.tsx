'use client'

import React, { useState } from 'react'
import { SlidePresentation, SlideTheme } from '@/types'
import { GlassCard, GlassButton } from '@/components/ui'
import { SlideDisplay } from '@/components/SlideDisplay'
import { SpeakerNotes } from '@/components/SpeakerNotes'
import { SlideNavigation } from '@/components/SlideNavigation'
import { cn } from '@/lib/utils'

interface SlideViewerProps {
  presentation: SlidePresentation
  currentSlideIndex: number
  onSlideNavigation: (index: number) => void
  onReset: () => void
}

export function SlideViewer({ 
  presentation, 
  currentSlideIndex, 
  onSlideNavigation, 
  onReset 
}: SlideViewerProps) {
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const currentSlide = presentation.slides[currentSlideIndex]
  const totalSlides = presentation.slides.length

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      onSlideNavigation(currentSlideIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      onSlideNavigation(currentSlideIndex + 1)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') setIsFullscreen(false)
  }

  const exportToJSON = () => {
    const dataStr = JSON.stringify(presentation, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${presentation.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_slides.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div 
      className={cn(
        'space-y-6',
        isFullscreen && 'fixed inset-0 z-50 bg-black/95 p-8 overflow-auto'
      )}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#1877F2' }}>
            {presentation.topic}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#42A5F5' }}>
            {totalSlides} slides • {presentation.theme} theme
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <GlassButton
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            variant={showSpeakerNotes ? 'primary' : 'ghost'}
            size="sm"
          >
            {showSpeakerNotes ? '📝 Hide Notes' : '📝 Speaker Notes'}
          </GlassButton>
          
          <GlassButton
            onClick={() => setIsFullscreen(!isFullscreen)}
            variant="ghost"
            size="sm"
          >
            {isFullscreen ? '🔲 Exit Fullscreen' : '🔳 Fullscreen'}
          </GlassButton>

          <GlassButton
            onClick={exportToJSON}
            variant="ghost"
            size="sm"
          >
            💾 Export
          </GlassButton>

          <GlassButton
            onClick={onReset}
            variant="secondary"
            size="sm"
          >
            🔄 New Presentation
          </GlassButton>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        'grid gap-6',
        showSpeakerNotes ? 'lg:grid-cols-3' : 'grid-cols-1'
      )}>
        {/* Slide Display */}
        <div className={cn(showSpeakerNotes ? 'lg:col-span-2' : 'col-span-1')}>
          <SlideDisplay
            slide={currentSlide}
            theme={presentation.theme}
            isFullscreen={isFullscreen}
          />
        </div>

        {/* Speaker Notes */}
        {showSpeakerNotes && (
          <div className="lg:col-span-1">
            <SpeakerNotes
              notes={currentSlide.speakerNotes}
              slideNumber={currentSlide.slideNumber}
              totalSlides={totalSlides}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <SlideNavigation
        currentSlide={currentSlideIndex}
        totalSlides={totalSlides}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSlideSelect={onSlideNavigation}
        slides={presentation.slides}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="text-center text-xs space-y-1" style={{ color: '#42A5F5' }}>
        <p>⌨️ Keyboard shortcuts: ← → to navigate, Esc to exit fullscreen</p>
        <p>💡 Click on any slide thumbnail to jump to it</p>
      </div>
    </div>
  )
}