import { TypographyProvider } from './providers/TypographyProvider'
import { ClerkProvider } from '@clerk/nextjs'
import localFont from 'next/font/local'
import './globals.css'
import PWARegister from '@/components/PWARegister'

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
    <ClerkProvider
      appearance={{
        elements: {
          // ============================================
          // USER BUTTON - Avatar y menú desplegable
          // ============================================
          
          // Avatar
          avatarBox: "border-2 border-gray-700 hover:border-orange-500 transition-colors",
          
          // Menú desplegable - FONDO
          userButtonPopoverCard: "bg-[#1a1a1a] border border-gray-800 shadow-2xl",
          userButtonPopoverActions: "bg-[#1a1a1a]",
          
          // ⚠️ BOTONES DEL MENÚ - TAMAÑO Y COLOR MEJORADOS
          userButtonPopoverActionButton: "text-white hover:bg-[#2a2a2a] transition-colors text-base py-3",
          userButtonPopoverActionButtonText: "text-white font-medium text-base",
          userButtonPopoverActionButtonIcon: "text-white w-5 h-5",
          
          // Separador entre opciones
          userButtonPopoverActionButtonDivider: "bg-gray-700",
          
          // ⚠️ PREVIEW DEL USUARIO - NOMBRE Y EMAIL CON MEJOR TAMAÑO
          userPreview: "bg-[#1a1a1a] px-4 py-4",
          userPreviewTextContainer: "text-white",
          userPreviewMainIdentifier: "text-white font-semibold text-base",
          userPreviewSecondaryIdentifier: "text-gray-400 text-sm",
          
          // ⚠️ FOOTER - "Secured by Clerk" y "Development mode"
          userButtonPopoverFooter: "bg-[#1a1a1a] border-t border-gray-800 px-4 py-3",
          
          // ============================================
          // SIGN IN / SIGN UP - Formularios
          // ============================================
          
          // Tarjetas
          card: "bg-[#1a1a1a] border border-gray-800 shadow-xl",
          
          // Headers
          headerTitle: "text-white text-2xl",
          headerSubtitle: "text-gray-400 text-base",
          
          // Inputs
          formFieldInput: "bg-[#2a2a2a] border-gray-700 text-white text-base placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500",
          formFieldLabel: "text-gray-300 font-medium text-base",
          
          // Botones
          formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg transition-colors text-base py-3",
          
          // Botones sociales
          socialButtonsBlockButton: "bg-[#2a2a2a] border-gray-700 text-gray-200 hover:bg-[#3a3a3a] transition-colors text-base",
          
          // Links
          footerActionLink: "text-orange-500 hover:text-orange-400 font-medium text-base",
          
          // Divisores
          dividerLine: "bg-gray-700",
          dividerText: "text-gray-500 text-sm",
        },
      }}
    >
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