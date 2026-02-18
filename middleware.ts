import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/terminos-y-condiciones(.*)',
  '/terms-required',
  '/api/webhook-stripe',
  '/api/webhooks/clerk',
  '/api/terms-acceptance',
  '/api/plans',
  '/manifest.json',
  '/firebase-messaging-sw.js',
  '/sw.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

// Rutas del dashboard que requieren contrato aceptado
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request) => {
  // 1. Proteger rutas privadas (lógica original intacta)
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // 2. Verificar aceptación de términos en rutas del dashboard
  if (isDashboardRoute(request)) {
    const { userId } = await auth()

    if (userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: user, error } = await supabase
          .from('users')
          .select('terms_accepted')
          .eq('id', userId)
          .single()

        // ✅ CASO 1: error de BD (incluyendo usuario no encontrado = PGRST116)
        // ✅ CASO 2: usuario existe pero no aceptó términos
        // ✅ CASO 3: Google OAuth — usuario sin registro en BD
        // En TODOS estos casos → redirigir a terms-required
        const termsAccepted = !error && user?.terms_accepted === true

        if (!termsAccepted) {
          const termsUrl = new URL('/terms-required', request.url)
          termsUrl.searchParams.set('redirect', request.nextUrl.pathname)
          return NextResponse.redirect(termsUrl)
        }

      } catch (err) {
        // Fallo de BD → bloquear por seguridad (fail-secure, no fail-open)
        console.error('[Middleware] Error verificando términos:', err)
        const termsUrl = new URL('/terms-required', request.url)
        termsUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(termsUrl)
      }
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|json|xml|txt)$).*)',
  ],
}