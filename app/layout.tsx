import { TypographyProvider } from './providers/TypographyProvider'
import { ClerkProvider } from '@clerk/nextjs'
import localFont from 'next/font/local'  // ← CAMBIO AQUÍ
import './globals.css'
import PWARegister from '@/components/PWARegister'

// ← CAMBIO AQUÍ (6 líneas en lugar de 1)
const inter = localFont({
  src: './fonts/Inter-VariableFont.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
})

export const metadata = {
  title: 'ReKalcula - Optimiza tu negocio con IA',
  description: 'Analiza tus facturas con IA y descubre cómo aumentar tus beneficios en minutos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ReKalcula',
  },
}

export const viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="ReKalcula" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={inter.className} style={{backgroundColor: '#EFE8B2'}}>
        <TypographyProvider>
          {children}
        </TypographyProvider>
      </body>
      </html>
    </ClerkProvider>
  )
}