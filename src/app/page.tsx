import Link from 'next/link'
import { GlassCard, GlassButton } from '@/components/ui'
import { ApiKeyGuard } from '@/components/ApiKeyStatus'

export default function Home() {
  return (
    <ApiKeyGuard>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4 animate-fade-in">
            Welcome to Email Template Generator
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 animate-fade-in max-w-2xl mx-auto">
            Transform your emails with AI-powered templates and personalized training. 
            Create professional, engaging emails with our modern glass design interface.
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          <Link href="/template-enhancer" className="group">
            <GlassCard className="p-6 md:p-8 animate-slide-up cursor-pointer h-full" hover>
              <div className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform">📧</div>
              <h2 className="text-xl md:text-2xl font-semibold mb-3 text-text-primary">Template Enhancer</h2>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Choose from six professional templates to enhance your email drafts. 
                Perfect for office communication, friendly messages, polite replies, and more.
              </p>
              <GlassButton variant="primary" size="md" className="w-full group-hover:scale-105 transition-transform">
                Get Started →
              </GlassButton>
            </GlassCard>
          </Link>
          
          <Link href="/trainer" className="group">
            <GlassCard className="p-6 md:p-8 animate-slide-up cursor-pointer h-full" hover>
              <div className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
              <h2 className="text-xl md:text-2xl font-semibold mb-3 text-text-primary">AI Trainer</h2>
              <p className="text-text-secondary mb-6 leading-relaxed">
                Train the AI with your input/output examples for personalized email generation. 
                Create custom responses that match your unique communication style.
              </p>
              <GlassButton variant="secondary" size="md" className="w-full group-hover:scale-105 transition-transform">
                Try Trainer →
              </GlassButton>
            </GlassCard>
          </Link>
        </div>

        {/* Getting Started Guide */}
        <div className="max-w-4xl mx-auto mb-16">
          <GlassCard className="p-6 md:p-8" opacity="low">
            <h3 className="text-xl md:text-2xl font-semibold text-text-primary mb-6 text-center">
              🚀 Getting Started
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-3">🔑</div>
                <h4 className="font-semibold text-text-primary mb-2">1. Add API Key</h4>
                <p className="text-sm text-text-secondary">
                  Enter your Google Gemini API key to unlock AI-powered features
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">📝</div>
                <h4 className="font-semibold text-text-primary mb-2">2. Choose Feature</h4>
                <p className="text-sm text-text-secondary">
                  Select Template Enhancer for quick improvements or AI Trainer for custom styles
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">✨</div>
                <h4 className="font-semibold text-text-primary mb-2">3. Generate</h4>
                <p className="text-sm text-text-secondary">
                  Watch as AI transforms your emails into professional, engaging messages
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
        
        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto">
          <GlassCard className="p-4 md:p-6 text-center" opacity="low">
            <div className="text-2xl md:text-3xl mb-3">✨</div>
            <h3 className="font-semibold text-text-primary mb-2">Modern Design</h3>
            <p className="text-sm text-text-secondary">
              Apple-inspired glass morphism interface with smooth animations and responsive design
            </p>
          </GlassCard>
          <GlassCard className="p-4 md:p-6 text-center" opacity="low">
            <div className="text-2xl md:text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-text-primary mb-2">Secure & Private</h3>
            <p className="text-sm text-text-secondary">
              Client-side API key storage with HTTPS encryption and session-only data handling
            </p>
          </GlassCard>
          <GlassCard className="p-4 md:p-6 text-center" opacity="low">
            <div className="text-2xl md:text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-text-primary mb-2">Fast & Reliable</h3>
            <p className="text-sm text-text-secondary">
              Powered by Google Gemini AI with optimized performance and error handling
            </p>
          </GlassCard>
        </div>
      </div>
    </ApiKeyGuard>
  )
}