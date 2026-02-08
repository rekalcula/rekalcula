import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  images: {
    unoptimized: true
  },
  trailingSlash: true,

  // ========================================
  // HEADERS DE SEGURIDAD
  // ========================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          // ========================================
          // CSP - Content Security Policy
          // Previene inyección de scripts maliciosos
          // ========================================
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com https://*.firebaseio.com https://*.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com https://*.clerk.dev",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.dev https://api.stripe.com https://fcm.googleapis.com https://*.googleapis.com https://api.resend.com https://firebaseinstallations.googleapis.com",
              "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://js.stripe.com https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;