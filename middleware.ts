import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rutas públicas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/api/webhook(.*)',
  '/api/webhook-stripe(.*)',
  '/api/plans',
  '/manifest.json',
  '/firebase-messaging-sw.js',
  '/sw.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

export default clerkMiddleware(async (auth, request) => {
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
     * - Static files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|json|xml|txt)$).*)',
  ],
}