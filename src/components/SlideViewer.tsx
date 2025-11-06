'use client'

import React, { useState } from 'react'
import { SlidePresentation, SlideTheme } from '@/types'
import { GlassCard, GlassButton } from '@/components/ui'
import { SlideDisplay } from '@/components/SlideDisplay'
import { SpeakerNotes } from '@/components/SpeakerNotes'
import { SlideNavigation } from '@/components/SlideNavigation'
import { cn } from '@/lib/utils'
import pptxgen from 'pptxgenjs'

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

  const exportToPowerPoint = () => {
    const ppt = new pptxgen()

    // Theme color mappings
    const themeColors: Record<SlideTheme, { bg: string; title: string; content: string; accent: string }> = {
      [SlideTheme.MODERN]: {
        bg: '667eea',
        title: 'ffffff',
        content: 'f8fafc',
        accent: 'f093fb'
      },
      [SlideTheme.CORPORATE]: {
        bg: '1e3a8a',
        title: 'ffffff',
        content: 'e5e7eb',
        accent: '60a5fa'
      },
      [SlideTheme.CREATIVE]: {
        bg: 'f59e0b',
        title: 'ffffff',
        content: 'fef3c7',
        accent: 'fbbf24'
      },
      [SlideTheme.MINIMAL]: {
        bg: 'f9fafb',
        title: '111827',
        content: '374151',
        accent: '6b7280'
      },
      [SlideTheme.DARK]: {
        bg: '111827',
        title: 'f9fafb',
        content: 'd1d5db',
        accent: '06b6d4'
      }
    }

    const colors = themeColors[presentation.theme]

    // Configure presentation properties
    ppt.author = 'EmailAi By Muminur'
    ppt.title = presentation.topic
    ppt.subject = `${presentation.theme} theme presentation`

    // Create slides
    presentation.slides.forEach((slide) => {
      const pptSlide = ppt.addSlide()

      // Set background color
      pptSlide.background = { color: colors.bg }

      // Add slide number (top right)
      pptSlide.addText(slide.slideNumber.toString(), {
        x: 9.0,
        y: 0.3,
        w: 0.8,
        h: 0.3,
        fontSize: 12,
        color: colors.content,
        align: 'right'
      })

      // Add title
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 1.5,
        w: 9.0,
        h: 1.2,
        fontSize: 36,
        bold: true,
        color: colors.title,
        align: 'left',
        valign: 'top'
      })

      // Add content bullets
      if (slide.content.length > 0) {
        pptSlide.addText(
          slide.content.map(point => ({ text: point, options: { bullet: true } })),
          {
            x: 0.8,
            y: 3.0,
            w: 8.5,
            h: 3.5,
            fontSize: 18,
            color: colors.content,
            align: 'left',
            valign: 'top',
            lineSpacing: 32
          }
        )
      }

      // Add watermark (bottom left)
      pptSlide.addText('EmailAi By Muminur', {
        x: 0.3,
        y: 7.0,
        w: 3.0,
        h: 0.3,
        fontSize: 10,
        color: colors.content,
        align: 'left',
        transparency: 60
      })

      // Add speaker notes
      if (slide.speakerNotes) {
        pptSlide.addNotes(slide.speakerNotes)
      }
    })

    // Save the presentation
    const filename = `${presentation.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.pptx`
    ppt.writeFile({ fileName: filename })
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
            💾 Export JSON
          </GlassButton>

          <GlassButton
            onClick={exportToPowerPoint}
            variant="ghost"
            size="sm"
          >
            📊 Export PPT
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