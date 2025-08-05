'use client'

import React from 'react'
import { Slide } from '@/types'
import { GlassCard, GlassButton } from '@/components/ui'
import { cn } from '@/lib/utils'

interface SlideNavigationProps {
  currentSlide: number
  totalSlides: number
  onPrevious: () => void
  onNext: () => void
  onSlideSelect: (index: number) => void
  slides: Slide[]
}

export function SlideNavigation({ 
  currentSlide, 
  totalSlides, 
  onPrevious, 
  onNext, 
  onSlideSelect,
  slides 
}: SlideNavigationProps) {
  return (
    <GlassCard className="p-4 md:p-6">
      <div className="space-y-4">
        {/* Main Navigation Controls */}
        <div className="flex items-center justify-between">
          <GlassButton
            onClick={onPrevious}
            disabled={currentSlide === 0}
            variant="ghost"
            size="md"
            className="flex items-center gap-2"
          >
            ← Previous
          </GlassButton>

          <div className="text-center">
            <div className="text-lg font-semibold" style={{ color: '#1877F2' }}>
              {currentSlide + 1} / {totalSlides}
            </div>
            <div className="text-xs" style={{ color: '#42A5F5' }}>
              {slides[currentSlide]?.title}
            </div>
          </div>

          <GlassButton
            onClick={onNext}
            disabled={currentSlide === totalSlides - 1}
            variant="ghost"
            size="md"
            className="flex items-center gap-2"
          >
            Next →
          </GlassButton>
        </div>

        {/* Slide Thumbnails */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-center" style={{ color: '#1877F2' }}>
            Jump to Slide
          </div>
          
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-32 overflow-y-auto">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => onSlideSelect(index)}
                className={cn(
                  'group relative aspect-[16/9] rounded-lg border-2 transition-all duration-300',
                  'hover:scale-105 hover:shadow-lg',
                  currentSlide === index
                    ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                )}
                title={slide.title}
              >
                {/* Slide Number */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span 
                    className={cn(
                      'text-xs font-bold',
                      currentSlide === index ? 'text-blue-300' : 'text-white/70'
                    )}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Current Slide Indicator */}
                {currentSlide === index && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">●</span>
                  </div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: '#42A5F5' }}>
            <span>Presentation Progress</span>
            <span>{Math.round(((currentSlide + 1) / totalSlides) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-2 text-xs" style={{ color: '#42A5F5' }}>
          <span>Quick jump:</span>
          <button 
            onClick={() => onSlideSelect(0)}
            className="hover:text-blue-300 transition-colors"
          >
            First
          </button>
          <span>•</span>
          <button 
            onClick={() => onSlideSelect(Math.floor(totalSlides / 2))}
            className="hover:text-blue-300 transition-colors"
          >
            Middle
          </button>
          <span>•</span>
          <button 
            onClick={() => onSlideSelect(totalSlides - 1)}
            className="hover:text-blue-300 transition-colors"
          >
            Last
          </button>
        </div>
      </div>
    </GlassCard>
  )
}