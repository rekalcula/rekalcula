import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'reKalcula - Optimiza tu negocio con IA',
  description: 'Analiza tus facturas con IA y descubre cómo aumentar tus beneficios en minutos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}