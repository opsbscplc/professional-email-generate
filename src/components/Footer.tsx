'use client'

import React from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui'

export function Footer() {
  return (
    <footer className="mt-auto p-4">
      <GlassCard className="px-6 py-4" opacity="low">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="text-lg">📧</div>
            <span className="text-sm text-text-secondary">
              Email Template Generator
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/template-enhancer" 
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Template Enhancer
            </Link>
            <Link 
              href="/trainer" 
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              AI Trainer
            </Link>
          </nav>

          {/* Attribution */}
          <div className="text-xs text-text-secondary text-center md:text-right">
            <p>Powered by Google Gemini AI</p>
            <p className="mt-1">Built with Next.js & Tailwind CSS</p>
          </div>
        </div>
      </GlassCard>
    </footer>
  )
}