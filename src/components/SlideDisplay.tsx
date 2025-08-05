'use client'

import React from 'react'
import { Slide, SlideTheme } from '@/types'
import { GlassCard } from '@/components/ui'
import { cn } from '@/lib/utils'

interface SlideDisplayProps {
  slide: Slide
  theme: SlideTheme
  isFullscreen?: boolean
}

const themeStyles = {
  [SlideTheme.MODERN]: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleColor: '#ffffff',
    contentColor: '#f8fafc',
    accentColor: '#f093fb'
  },
  [SlideTheme.CORPORATE]: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    titleColor: '#ffffff',
    contentColor: '#e5e7eb',
    accentColor: '#60a5fa'
  },
  [SlideTheme.CREATIVE]: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
    titleColor: '#ffffff',
    contentColor: '#fef3c7',
    accentColor: '#fbbf24'
  },
  [SlideTheme.MINIMAL]: {
    background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
    titleColor: '#111827',
    contentColor: '#374151',
    accentColor: '#6b7280'
  },
  [SlideTheme.DARK]: {
    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
    titleColor: '#f9fafb',
    contentColor: '#d1d5db',
    accentColor: '#06b6d4'
  }
}

export function SlideDisplay({ slide, theme, isFullscreen }: SlideDisplayProps) {
  const themeStyle = themeStyles[theme]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl shadow-2xl',
      isFullscreen ? 'h-[80vh]' : 'aspect-[16/9] max-w-4xl mx-auto'
    )}>
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{ background: themeStyle.background }}
      />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div 
          className="w-full h-full rounded-full blur-xl"
          style={{ backgroundColor: themeStyle.accentColor }}
        />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
        <div 
          className="w-full h-full rounded-full blur-xl"
          style={{ backgroundColor: themeStyle.accentColor }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12">
        {/* Slide Number */}
        <div className="absolute top-4 right-6 text-sm opacity-60" style={{ color: themeStyle.contentColor }}>
          {slide.slideNumber}
        </div>

        {/* Title */}
        <h1 
          className={cn(
            'font-bold mb-8 leading-tight',
            isFullscreen ? 'text-4xl md:text-6xl' : 'text-2xl md:text-4xl'
          )}
          style={{ color: themeStyle.titleColor }}
        >
          {slide.title}
        </h1>

        {/* Content */}
        <div className="space-y-4">
          {slide.content.map((point, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div 
                className={cn(
                  'flex-shrink-0 w-2 h-2 rounded-full mt-3',
                  isFullscreen ? 'w-3 h-3 mt-4' : 'w-2 h-2 mt-3'
                )}
                style={{ backgroundColor: themeStyle.accentColor }}
              />
              <p 
                className={cn(
                  'leading-relaxed',
                  isFullscreen ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
                )}
                style={{ color: themeStyle.contentColor }}
              >
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Brand Watermark */}
        <div className="absolute bottom-4 left-6 text-xs opacity-40" style={{ color: themeStyle.contentColor }}>
          EmailAi By Muminur
        </div>
      </div>

      {/* Subtle Border */}
      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />
    </div>
  )
}