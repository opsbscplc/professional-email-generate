import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateApiKey(apiKey: string): boolean {
  // Basic validation for Google Gemini API key format
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }
  
  // Google AI API keys typically start with 'AI' and are around 39 characters long
  const trimmedKey = apiKey.trim()
  return trimmedKey.length >= 20 && 
         trimmedKey.length <= 50 && 
         trimmedKey.startsWith('AI') &&
         /^[A-Za-z0-9_-]+$/.test(trimmedKey)
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}