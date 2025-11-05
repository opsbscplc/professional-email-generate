'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GlassCard, GlassButton } from '@/components/ui'
import { ApiKeyStatus } from './ApiKeyStatus'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 p-4">
      <GlassCard className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
            <div className="text-xl md:text-2xl">📧</div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-lg font-bold" style={{ color: '#1877F2' }}>
                EmailAi By Muminur
              </h1>
              <p className="text-xs" style={{ color: '#42A5F5' }}>
                AI-powered email enhancement
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold" style={{ color: '#1877F2' }}>
                EmailAi By Muminur
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/template-enhancer" 
              className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                isActive('/template-enhancer') 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{ color: isActive('/template-enhancer') ? '#1877F2' : '#42A5F5' }}
            >
              Template Enhancer
            </Link>
            <Link 
              href="/trainer" 
              className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                isActive('/trainer') 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{ color: isActive('/trainer') ? '#1877F2' : '#42A5F5' }}
            >
              AI Trainer
            </Link>
            <Link 
              href="/generate-slides" 
              className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                isActive('/generate-slides') 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{ color: isActive('/generate-slides') ? '#1877F2' : '#42A5F5' }}
            >
              Generate Slides
            </Link>
          </nav>

          {/* Right side - API Key Status and Mobile Menu */}
          <div className="flex items-center gap-2">
            <ApiKeyStatus />
            
            {/* Mobile Menu Button */}
            <GlassButton
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <div className="w-4 h-4 flex flex-col justify-center">
                <div className={`h-0.5 w-4 bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`} />
                <div className={`h-0.5 w-4 bg-current mt-1 transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`} />
              </div>
            </GlassButton>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col gap-2">
              <Link 
                href="/template-enhancer" 
                className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                  isActive('/template-enhancer') 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive('/template-enhancer') ? '#1877F2' : '#42A5F5' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📧 Template Enhancer
              </Link>
              <Link 
                href="/trainer" 
                className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                  isActive('/trainer') 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive('/trainer') ? '#1877F2' : '#42A5F5' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🤖 AI Trainer
              </Link>
              <Link 
                href="/generate-slides" 
                className={`text-sm transition-colors px-3 py-2 rounded-lg ${
                  isActive('/generate-slides') 
                    ? 'bg-white/10' 
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive('/generate-slides') ? '#1877F2' : '#42A5F5' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎨 Generate Slides
              </Link>
            </div>
          </nav>
        )}
      </GlassCard>
    </header>
  )
}