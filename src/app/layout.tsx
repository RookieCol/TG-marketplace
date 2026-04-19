import type { Metadata } from 'next'
import Script from 'next/script'
import { MaterialProvider } from '@/components/material-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'GreenStore',
  description: 'Tu tienda de confianza',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen max-w-md mx-auto">
        <MaterialProvider>
          {children}
        </MaterialProvider>
      </body>
    </html>
  )
}
