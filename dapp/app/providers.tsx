'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { NetworkProvider } from '../contexts/NetworkContext'
import { MetaMaskProvider } from '../contexts/MetaMaskContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  // Initialize PDF.js worker globally
  useEffect(() => {
    import('../lib/pdfWorker').then(async ({ getPDFJS }) => {
      await getPDFJS()
      console.log('[App] PDF.js worker initialized')
    }).catch((error) => {
      console.error('[App] Failed to initialize PDF.js worker:', error)
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NetworkProvider>
          <MetaMaskProvider>
            {children}
          </MetaMaskProvider>
        </NetworkProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}