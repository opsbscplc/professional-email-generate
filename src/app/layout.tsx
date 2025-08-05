import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EmailAi By Muminur',
  description: 'AI-powered email template generator with modern glass design by Engr. Md Muminur Rahman',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
          <ErrorBoundary>
            <ApiKeyProvider>
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </ApiKeyProvider>
          </ErrorBoundary>
        </div>
      </body>
    </html>
  )
}