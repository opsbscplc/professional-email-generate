'use client'

import React, { useState } from 'react'
import { useApiKey } from '@/contexts/ApiKeyContext'
import { SlideGenerator } from '@/components/SlideGenerator'
import { ApiKeyGuard } from '@/components/ApiKeyStatus'

export default function GenerateSlidesPage() {
  return (
    <ApiKeyGuard>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="space-y-6 md:space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#1877F2' }}>
              🎨 AI Slide Generator
            </h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: '#42A5F5' }}>
              Create professional presentation slides with AI-powered content generation. 
              Choose from beautiful themes and let AI craft engaging slides with speaker notes.
            </p>
          </div>
          
          <SlideGenerator />
        </div>
      </div>
    </ApiKeyGuard>
  )
}