'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false)

  const exportDropdownRef = useRef<HTMLDivElement>(null)

  const currentSlide = presentation.slides[currentSlideIndex]
  const totalSlides = presentation.slides.length

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false)
      }
    }

    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExportDropdownOpen])

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
    setIsExportDropdownOpen(false)
  }

  const exportToPowerPoint = async () => {
    const pptxgen = (await import('pptxgenjs')).default
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
    setIsExportDropdownOpen(false)
  }

  const exportToPDF = async () => {
    // Create PDF in landscape mode (presentation format)
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Theme color mappings (RGB values for PDF)
    const themeColorsRGB: Record<SlideTheme, { bg: [number, number, number]; title: [number, number, number]; content: [number, number, number]; accent: [number, number, number] }> = {
      [SlideTheme.MODERN]: {
        bg: [102, 126, 234],
        title: [255, 255, 255],
        content: [248, 250, 252],
        accent: [240, 147, 251]
      },
      [SlideTheme.CORPORATE]: {
        bg: [30, 58, 138],
        title: [255, 255, 255],
        content: [229, 231, 235],
        accent: [96, 165, 250]
      },
      [SlideTheme.CREATIVE]: {
        bg: [245, 158, 11],
        title: [255, 255, 255],
        content: [254, 243, 199],
        accent: [251, 191, 36]
      },
      [SlideTheme.MINIMAL]: {
        bg: [249, 250, 251],
        title: [17, 24, 39],
        content: [55, 65, 81],
        accent: [107, 115, 128]
      },
      [SlideTheme.DARK]: {
        bg: [17, 24, 39],
        title: [249, 250, 251],
        content: [209, 213, 219],
        accent: [6, 182, 212]
      }
    }

    const colors = themeColorsRGB[presentation.theme]

    presentation.slides.forEach((slide, index) => {
      if (index > 0) {
        pdf.addPage()
      }

      // Set background color
      pdf.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2])
      pdf.rect(0, 0, 297, 210, 'F')

      // Add slide number (top right)
      pdf.setFontSize(10)
      pdf.setTextColor(colors.content[0], colors.content[1], colors.content[2])
      pdf.text(slide.slideNumber.toString(), 285, 15, { align: 'right' })

      // Add title
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(colors.title[0], colors.title[1], colors.title[2])

      // Word wrap title if too long
      const titleLines = pdf.splitTextToSize(slide.title, 250)
      pdf.text(titleLines, 20, 40)

      // Add content bullets
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(colors.content[0], colors.content[1], colors.content[2])

      let yPosition = 70
      slide.content.forEach((point, i) => {
        // Word wrap content
        const contentLines = pdf.splitTextToSize(`• ${point}`, 250)
        pdf.text(contentLines, 25, yPosition)
        yPosition += contentLines.length * 8 + 5
      })

      // Add watermark (bottom left)
      pdf.setFontSize(8)
      pdf.setTextColor(colors.content[0], colors.content[1], colors.content[2], 0.6)
      pdf.text('EmailAi By Muminur', 20, 195)

      // Add speaker notes as text on a separate area (small font at bottom)
      if (slide.speakerNotes) {
        pdf.setFontSize(7)
        pdf.setTextColor(colors.content[0], colors.content[1], colors.content[2], 0.5)
        const notesLines = pdf.splitTextToSize(`Notes: ${slide.speakerNotes}`, 250)
        pdf.text(notesLines, 20, 200)
      }
    })

    // Save the PDF
    const filename = `${presentation.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.pdf`
    pdf.save(filename)
    setIsExportDropdownOpen(false)
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

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <GlassButton
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              variant="ghost"
              size="sm"
            >
              💾 Export {isExportDropdownOpen ? '▲' : '▼'}
            </GlassButton>

            {/* Dropdown Menu */}
            {isExportDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl z-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                }}
              >
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-white/50"
                  style={{ color: '#1877F2' }}
                >
                  <span className="text-lg">📄</span>
                  <div className="flex-1">
                    <div className="font-medium">Export as PDF</div>
                    <div className="text-xs opacity-70">Portable Document Format</div>
                  </div>
                </button>

                <div
                  className="h-px mx-2"
                  style={{ background: 'rgba(24, 119, 242, 0.1)' }}
                />

                <button
                  onClick={exportToPowerPoint}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-white/50"
                  style={{ color: '#1877F2' }}
                >
                  <span className="text-lg">📊</span>
                  <div className="flex-1">
                    <div className="font-medium">Export as PowerPoint</div>
                    <div className="text-xs opacity-70">Microsoft PowerPoint (.pptx)</div>
                  </div>
                </button>

                <div
                  className="h-px mx-2"
                  style={{ background: 'rgba(24, 119, 242, 0.1)' }}
                />

                <button
                  onClick={exportToJSON}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-white/50"
                  style={{ color: '#1877F2' }}
                >
                  <span className="text-lg">💾</span>
                  <div className="flex-1">
                    <div className="font-medium">Export as JSON</div>
                    <div className="text-xs opacity-70">Raw presentation data</div>
                  </div>
                </button>
              </div>
            )}
          </div>

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