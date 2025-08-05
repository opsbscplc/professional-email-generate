'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui'
import { cn } from '@/lib/utils'

export function Footer() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  const footerLinks = [
    { href: '/template-enhancer', label: 'Template Enhancer', icon: '📧' },
    { href: '/trainer', label: 'AI Trainer', icon: '🤖' },
    { href: '#', label: 'Privacy', icon: '🔒' },
    { href: '#', label: 'Support', icon: '💬' },
  ]

  const techStack = [
    { name: 'Google Gemini AI', icon: '🧠' },
    { name: 'Next.js', icon: '⚡' },
    { name: 'Tailwind CSS', icon: '🎨' },
  ]

  return (
    <footer className="relative mt-auto p-4 overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-0 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-2xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-20 h-20 bg-gradient-to-br from-pink-500/5 to-blue-500/5 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <GlassCard className="relative px-6 py-6 hover-glow" opacity="low">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Brand Section */}
          <div className="flex items-center justify-center md:justify-start gap-3 group">
            <div className="text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-pulse-slow">
              📧
            </div>
            <div className="text-center md:text-left">
              <div className="text-sm font-semibold text-gradient group-hover:scale-105 transition-transform duration-300">
                EmailAi By Muminur
              </div>
              <div className="text-xs mt-1" style={{ color: '#42A5F5' }}>
                AI-Powered Email Enhancement
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-3">
            {footerLinks.map((link, index) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300',
                  'hover:bg-white/10 hover:scale-105',
                  hoveredLink === link.label && 'bg-white/10 scale-105'
                )}
                style={{ 
                  color: hoveredLink === link.label ? '#1877F2' : '#42A5F5',
                  animationDelay: `${index * 0.1}s`
                }}
                onMouseEnter={() => setHoveredLink(link.label)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <span className="group-hover:scale-110 transition-transform duration-300">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Tech Stack & Attribution */}
          <div className="text-center md:text-right">
            <div className="text-xs mb-3" style={{ color: '#42A5F5' }}>
              Powered by
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-2 mb-3">
              {techStack.map((tech, index) => (
                <div
                  key={tech.name}
                  className="group flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-xs group-hover:scale-110 transition-transform duration-300">
                    {tech.icon}
                  </span>
                  <span className="text-xs transition-colors duration-300" style={{ color: '#42A5F5' }}>
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
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