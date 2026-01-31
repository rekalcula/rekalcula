
// ============================================================
// FIREBASE CLIENT SDK - lib/firebase.ts
// ============================================================

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Inicializar Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Helper: Promise con timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  const timeout = new Promise<T>((_, reject) => 
    setTimeout(() => reject(new Error(errorMsg)), ms)
  )
  return Promise.race([promise, timeout])
}

// Obtener token FCM
export async function getFCMToken(): Promise<string | null> {
  try {
    // 1. Verificar soporte
    const supported = await isSupported()
    if (!supported) {
      console.error('[Firebase] Messaging no soportado en este navegador')
      return null
    }

    // 2. Verificar VAPID Key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('[Firebase] ❌ VAPID Key no configurada en .env.local')
      throw new Error('VAPID Key no configurada')
    }
    console.log('[Firebase] ✅ VAPID Key encontrada:', vapidKey.substring(0, 10) + '...')

    // 3. Solicitar permiso
    console.log('[Firebase] Solicitando permiso de notificaciones...')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.error('[Firebase] ❌ Permiso de notificaciones denegado')
      return null
    }
    console.log('[Firebase] ✅ Permiso concedido')

    // 4. Registrar Service Worker
    console.log('[Firebase] Registrando Service Worker...')
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope'
    })
    console.log('[Firebase] ✅ Service Worker registrado:', registration.scope)

    // 5. Esperar a que esté activo (CON TIMEOUT)
    console.log('[Firebase] Esperando Service Worker activo...')
    await withTimeout(
      navigator.serviceWorker.ready,
      5000,
      'Service Worker no se activó en 5 segundos'
    )
    console.log('[Firebase] ✅ Service Worker activo')

    // 6. Obtener instancia de messaging
    console.log('[Firebase] Obteniendo messaging instance...')
    const messaging = getMessaging(app)
    console.log('[Firebase] ✅ Messaging instance obtenida')

    // 7. Obtener token FCM
    console.log('[Firebase] Solicitando token FCM...')
    const token = await withTimeout(
      getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      }),
      10000,
      'getToken() no respondió en 10 segundos'
    )

    // 8. VALIDAR que sea un token válido
    if (!token) {
      console.error('[Firebase] ❌ getToken() retornó null o undefined')
      return null
    }

    if (typeof token !== 'string') {
      console.error('[Firebase] ❌ Token NO es una string, es:', typeof token, token)
      return null
    }

    if (token.length < 100) {
      console.error('[Firebase] ❌ Token demasiado corto:', token.length, 'caracteres')
      return null
    }

    console.log('[Firebase] ✅ Token FCM obtenido correctamente')
    console.log('[Firebase] Token (primeros 50 chars):', token.substring(0, 50) + '...')
    console.log('[Firebase] Token length:', token.length)
    
    return token

  } catch (error: any) {
    console.error('[Firebase] ❌ Error obteniendo token:', error)
    console.error('[Firebase] Error code:', error.code)
    console.error('[Firebase] Error message:', error.message)
    return null
  }
}

// Listener para mensajes en primer plano
export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {}
  
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app)
      onMessage(messaging, callback)
    }
  })
}

export { app }
