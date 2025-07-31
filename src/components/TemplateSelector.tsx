import React from 'react'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/GlassCard'
import { EmailTemplate } from '@/types/gemini'

interface TemplateOption {
  id: EmailTemplate
  name: string
  description: string
  icon: string
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: EmailTemplate.PROFESSIONAL,
    name: 'Professional',
    description: 'Formal tone suitable for office communication',
    icon: '💼'
  },
  {
    id: EmailTemplate.FRIEND,
    name: 'Friend',
    description: 'Casual and warm tone for personal communication',
    icon: '👋'
  },
  {
    id: EmailTemplate.POLITE,
    name: 'Polite',
    description: 'Extra courteous with respectful language',
    icon: '🙏'
  },
  {
    id: EmailTemplate.DIRECT,
    name: 'Direct',
    description: 'Concise and straight to the point',
    icon: '🎯'
  },
  {
    id: EmailTemplate.FOLLOWUP,
    name: 'Follow up',
    description: 'Professional follow-up with context',
    icon: '📧'
  },
  {
    id: EmailTemplate.REMINDER,
    name: 'Reminder',
    description: 'Gentle reminder that prompts action',
    icon: '⏰'
  }
]

interface TemplateSelectorProps {
  selectedTemplate: EmailTemplate | null
  onTemplateChange: (template: EmailTemplate) => void
  className?: string
  disabled?: boolean
}

export function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
  className,
  disabled = false
}: TemplateSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Choose Email Template
        </h3>
        <p className="text-sm text-text-secondary">
          Select one template to enhance your email draft
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATE_OPTIONS.map((template) => {
          const isSelected = selectedTemplate === template.id
          
          return (
            <GlassCard
              key={template.id}
              className={cn(
                'p-4 transition-all duration-200 cursor-pointer',
                isSelected && 'ring-2 ring-accent-primary bg-accent-primary/10 border-accent-primary/40',
                disabled && 'opacity-50 cursor-not-allowed',
                !disabled && !isSelected && 'hover:bg-white/15 hover:border-white/30'
              )}
              onClick={() => !disabled && onTemplateChange(template.id)}
              hover={!disabled && !isSelected}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl flex-shrink-0 mt-1">
                  {template.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    'font-medium mb-1',
                    isSelected ? 'text-accent-primary' : 'text-text-primary'
                  )}>
                    {template.name}
                  </h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {template.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
      
      {selectedTemplate && (
        <div className="mt-4 p-3 bg-accent-primary/10 border border-accent-primary/30 rounded-lg">
          <p className="text-sm text-accent-primary font-medium">
            ✓ {TEMPLATE_OPTIONS.find(t => t.id === selectedTemplate)?.name} template selected
          </p>
        </div>
      )}
    </div>
  )
}