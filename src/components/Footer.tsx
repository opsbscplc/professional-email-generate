'use client'

import React from 'react'
import { GlassCard } from '@/components/ui'

export function Footer() {

  return (
    <footer className="relative mt-auto p-4 overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-0 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-gradient-to-br from-pink-500/5 to-blue-500/5 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <GlassCard className="relative px-6 py-6 hover-glow" opacity="low">
        <div className="flex flex-col items-center gap-4">
          {/* Brand Section */}
          <div className="flex items-center gap-3 group">
            <div className="text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-pulse-slow">
              📧
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gradient group-hover:scale-105 transition-transform duration-300">
                EmailAi By Muminur
              </div>
              <div className="text-xs mt-1" style={{ color: '#42A5F5' }}>
                AI-Powered Email Enhancement
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="text-center">
            <div className="text-xs space-y-1" style={{ color: '#42A5F5' }}>
              <div>Developed by Engr. Md Muminur Rahman</div>
              <div>© 2025 All rights reserved</div>
            </div>
          </div>
        </div>

        {/* Animated bottom border */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        
        {/* Corner decorative elements */}
        <div className="absolute top-2 right-2 w-1 h-1 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-pulse" />
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-tr from-white/30 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </GlassCard>
    </footer>
  )
}