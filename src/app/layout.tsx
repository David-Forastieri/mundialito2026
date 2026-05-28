import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mundial 2026 Prode',
  description: 'Seguí el Mundial 2026 y competí con amigos en el prode',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mundial 2026',
  },
  openGraph: {
    title: 'Mundial 2026 Prode',
    description: 'Seguí el fixture y competí en grupos de predicciones',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF8200',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
