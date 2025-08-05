'use client'

import React from 'react'
import { GlassCard } from '@/components/ui'

interface SpeakerNotesProps {
  notes: string
  slideNumber: number
  totalSlides: number
}

export function SpeakerNotes({ notes, slideNumber, totalSlides }: SpeakerNotesProps) {
  return (
    <GlassCard className="p-6 h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: '#1877F2' }}>
            📝 Speaker Notes
          </h3>
          <span className="text-sm px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30" style={{ color: '#42A5F5' }}>
            Slide {slideNumber} of {totalSlides}
          </span>
        </div>

        {/* Notes Content */}
        <div className="space-y-4">
          <div 
            className="text-sm leading-relaxed p-4 rounded-lg bg-white/5 border border-white/10"
            style={{ color: '#42A5F5' }}
          >
            {notes}
          </div>

          {/* Tips */}
          <div className="space-y-2 text-xs" style={{ color: '#42A5F5' }}>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400">💡</span>
              <span>Take your time with each point - pause between bullet points</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">🎯</span>
              <span>Make eye contact with your audience while speaking</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">⏱️</span>
              <span>Aim for 1-2 minutes per slide for good pacing</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: '#42A5F5' }}>
            <span>Progress</span>
            <span>{Math.round((slideNumber / totalSlides) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(slideNumber / totalSlides) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  )
}