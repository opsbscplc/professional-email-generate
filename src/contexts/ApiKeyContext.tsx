'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { validateApiKey } from '@/lib/utils'
import { validateSessionTimeout, SESSION_TIMEOUT } from '@/lib/security'
import type { ApiKeyContextType } from '@/types'

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

const API_KEY_STORAGE_KEY = 'gemini_api_key'
const API_KEY_TIMESTAMP_KEY = 'gemini_api_key_timestamp'
// SESSION_TIMEOUT is now imported from security module

interface ApiKeyProviderProps {
  children: ReactNode
}

export function ApiKeyProvider({ children }: ApiKeyProviderProps) {
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Load API key from sessionStorage on mount
  useEffect(() => {
    const loadStoredApiKey = () => {
      try {
        const storedKey = sessionStorage.getItem(API_KEY_STORAGE_KEY)
        const storedTimestamp = sessionStorage.getItem(API_KEY_TIMESTAMP_KEY)
        
        if (storedKey && storedTimestamp) {
          const timestamp = parseInt(storedTimestamp, 10)
          const now = Date.now()
          
          // Check if the stored key has expired using security module
          if (!validateSessionTimeout(timestamp)) {
            // Key has expired, clear it
            sessionStorage.removeItem(API_KEY_STORAGE_KEY)
            sessionStorage.removeItem(API_KEY_TIMESTAMP_KEY)
            setSessionExpired(true)
            setIsLoading(false)
            return
          }
          
          // Validate the stored key format
          if (validateApiKey(storedKey)) {
            setApiKeyState(storedKey)
            setIsValid(true)
          } else {
            // Invalid key format, clear it
            sessionStorage.removeItem(API_KEY_STORAGE_KEY)
            sessionStorage.removeItem(API_KEY_TIMESTAMP_KEY)
          }
        }
      } catch (error) {
        console.warn('Failed to load API key from storage:', error)
        // Clear potentially corrupted data
        try {
          sessionStorage.removeItem(API_KEY_STORAGE_KEY)
          sessionStorage.removeItem(API_KEY_TIMESTAMP_KEY)
        } catch (clearError) {
          console.warn('Failed to clear corrupted API key data:', clearError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredApiKey()
  }, [])

  // Set up session timeout check
  useEffect(() => {
    if (!apiKey) return

    const checkSessionTimeout = () => {
      try {
        const storedTimestamp = sessionStorage.getItem(API_KEY_TIMESTAMP_KEY)
        if (storedTimestamp) {
          const timestamp = parseInt(storedTimestamp, 10)
          
          if (!validateSessionTimeout(timestamp)) {
            clearApiKey()
            setSessionExpired(true)
          }
        }
      } catch (error) {
        console.warn('Failed to check session timeout:', error)
      }
    }

    // Check timeout every 5 minutes
    const timeoutInterval = setInterval(checkSessionTimeout, 5 * 60 * 1000)
    
    return () => clearInterval(timeoutInterval)
  }, [apiKey])

  const setApiKey = (key: string) => {
    try {
      if (!validateApiKey(key)) {
        throw new Error('Invalid API key format')
      }

      const timestamp = Date.now().toString()
      sessionStorage.setItem(API_KEY_STORAGE_KEY, key)
      sessionStorage.setItem(API_KEY_TIMESTAMP_KEY, timestamp)
      
      setApiKeyState(key)
      setIsValid(true)
    } catch (error) {
      console.error('Failed to store API key:', error)
      throw error
    }
  }

  const clearApiKey = () => {
    try {
      sessionStorage.removeItem(API_KEY_STORAGE_KEY)
      sessionStorage.removeItem(API_KEY_TIMESTAMP_KEY)
    } catch (error) {
      console.warn('Failed to clear API key from storage:', error)
    }
    
    setApiKeyState(null)
    setIsValid(false)
    setSessionExpired(false)
  }

  // Clear API key when the page is about to unload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: We don't clear on beforeunload as users might just be refreshing
      // The session timeout mechanism handles expiration
    }

    const handleVisibilityChange = () => {
      // Clear API key if the tab has been hidden for too long
      if (document.visibilityState === 'visible' && apiKey) {
        try {
          const storedTimestamp = sessionStorage.getItem(API_KEY_TIMESTAMP_KEY)
          if (storedTimestamp) {
            const timestamp = parseInt(storedTimestamp, 10)
            
            if (!validateSessionTimeout(timestamp)) {
              clearApiKey()
              setSessionExpired(true)
            }
          }
        } catch (error) {
          console.warn('Failed to check API key timeout on visibility change:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [apiKey])

  const contextValue: ApiKeyContextType = {
    apiKey,
    setApiKey,
    clearApiKey,
    isValid,
    sessionExpired,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ApiKeyContext.Provider value={contextValue}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKey(): ApiKeyContextType {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider')
  }
  return context
}