import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/api/webhook(.*)',          // Webhooks de Stripe
  '/api/webhook-stripe(.*)',   // Webhook de Stripe alternativo
  '/api/plans',                // Lista de planes (pública)
  '/manifest.json',            // PWA manifest
  '/favicon.ico',              // Favicon
  '/robots.txt',               // SEO
  '/sitemap.xml',              // SEO
])

// Rutas que deben ser ignoradas completamente por el middleware
const isIgnoredRoute = createRouteMatcher([
  '/_next(.*)',
  '/static(.*)',
  '/(.*)\\.png',
  '/(.*)\\.jpg',
  '/(.*)\\.jpeg',
  '/(.*)\\.gif',
  '/(.*)\\.svg',
  '/(.*)\\.ico',
  '/(.*)\\.webp',
  '/(.*)\\.woff',
  '/(.*)\\.woff2',
  '/(.*)\\.ttf',
  '/(.*)\\.css',
  '/(.*)\\.js',
])

export default clerkMiddleware(async (auth, request) => {
  // Ignorar rutas estáticas
  if (isIgnoredRoute(request)) {
    return
  }
  
  // No proteger rutas públicas
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
}