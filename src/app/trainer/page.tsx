'use client'

import { TrainerInterface } from '@/components/TrainerInterface'

export default function TrainerPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="space-y-6 md:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            AI Email Trainer
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto text-sm md:text-base">
            Train the AI with your communication style by providing input-output examples, 
            then use it to transform new emails following the same pattern.
          </p>
        </div>
        
        <TrainerInterface />
      </div>
    </div>
  )
}