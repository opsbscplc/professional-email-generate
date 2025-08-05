'use client'

import React from 'react'
import { SlideTheme } from '@/types'
import { GlassCard } from '@/components/ui'
import { cn } from '@/lib/utils'

interface ThemeSelectorProps {
  selectedTheme: SlideTheme
  onThemeSelect: (theme: SlideTheme) => void
  disabled?: boolean
}

const themes = [
  {
    id: SlideTheme.MODERN,
    name: 'Modern',
    description: 'Clean lines with vibrant accents',
    colors: ['#667eea', '#764ba2', '#f093fb'],
    icon: '✨'
  },
  {
    id: SlideTheme.CORPORATE,
    name: 'Corporate',
    description: 'Professional blue and gray tones',
    colors: ['#1e3a8a', '#3b82f6', '#e5e7eb'],
    icon: '🏢'
  },
  {
    id: SlideTheme.CREATIVE,
    name: 'Creative',
    description: 'Bold colors and artistic flair',
    colors: ['#f59e0b', '#ef4444', '#8b5cf6'],
    icon: '🎨'
  },
  {
    id: SlideTheme.MINIMAL,
    name: 'Minimal',
    description: 'Simple and elegant design',
    colors: ['#374151', '#6b7280', '#f9fafb'],
    icon: '⚪'
  },
  {
    id: SlideTheme.DARK,
    name: 'Dark',
    description: 'Sophisticated dark theme',
    colors: ['#111827', '#4f46e5', '#06b6d4'],
    icon: '🌙'
  }
]

export function ThemeSelector({ selectedTheme, onThemeSelect, disabled }: ThemeSelectorProps) {
  return (
    <GlassCard className="p-6 md:p-8">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1877F2' }}>
            Choose Your Theme
          </h2>
          <p className="text-sm" style={{ color: '#42A5F5' }}>
            Select a visual theme that matches your presentation style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => !disabled && onThemeSelect(theme.id)}
              disabled={disabled}
              className={cn(
                'group relative p-4 rounded-xl border-2 transition-all duration-300',
                'hover:scale-105 hover:shadow-lg',
                selectedTheme === theme.id
                  ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
            >
              {/* Theme Preview */}
              <div className="space-y-3">
                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  {theme.icon}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm" style={{ color: '#1877F2' }}>
                    {theme.name}
                  </h3>
                  <p className="text-xs leading-tight" style={{ color: '#42A5F5' }}>
                    {theme.description}
                  </p>
                </div>

                {/* Color Preview */}
                <div className="flex justify-center gap-1">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedTheme === theme.id && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>

        <div className="text-center text-xs" style={{ color: '#42A5F5' }}>
          🎯 Each theme will be applied to all 20 slides for a consistent look
        </div>
      </div>
    </GlassCard>
  )
}