// ============================================================
// FIREBASE CLIENT SDK - lib/firebase.ts  
// VERSIÓN MEJORADA: Registro explícito de Service Worker
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

// ============================================================
// REGISTRAR SERVICE WORKER EXPLÍCITAMENTE
// ============================================================
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.error('[Firebase] Service Worker no soportado')
      return null
    }

    console.log('[Firebase] Registrando Service Worker...')
    
    // Registrar el SW
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    })

    console.log('[Firebase] ✅ Service Worker registrado')

    // Esperar a que esté activo
    await navigator.serviceWorker.ready
    console.log('[Firebase] ✅ Service Worker activo y listo')

    return registration

  } catch (error: any) {
    console.error('[Firebase] ❌ Error registrando SW:', error.message)
    return null
  }
}

// ============================================================
// OBTENER TOKEN FCM - VERSIÓN MEJORADA CON SW EXPLÍCITO
// ============================================================
export async function getFCMToken(): Promise<string | null> {
  try {
    console.log('[Firebase] ====== INICIANDO PROCESO ======')

    // 1. Verificar soporte
    const supported = await isSupported()
    if (!supported) {
      console.error('[Firebase] ❌ Messaging no soportado en este navegador')
      return null
    }
    console.log('[Firebase] ✅ Messaging soportado')

    // 2. Verificar VAPID Key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('[Firebase] ❌ VAPID Key no configurada')
      return null
    }
    console.log('[Firebase] ✅ VAPID Key encontrada')

    // 3. REGISTRAR SERVICE WORKER EXPLÍCITAMENTE (CRÍTICO PARA ANDROID)
    const swRegistration = await registerServiceWorker()
    if (!swRegistration) {
      console.error('[Firebase] ❌ No se pudo registrar Service Worker')
      return null
    }

    // 4. Solicitar permiso
    console.log('[Firebase] Solicitando permiso de notificaciones...')
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.error('[Firebase] ❌ Permiso denegado por el usuario')
      return null
    }
    console.log('[Firebase] ✅ Permiso concedido')

    // 5. Obtener messaging instance CON el SW registration
    console.log('[Firebase] Obteniendo messaging instance...')
    const messaging = getMessaging(app)
    console.log('[Firebase] ✅ Messaging instance obtenida')

    // 6. Solicitar token FCM usando el SW registration
    console.log('[Firebase] Solicitando token FCM...')
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: swRegistration // ← CLAVE: pasar el SW explícitamente
    })

    // 7. Validar token
    if (!token) {
      console.error('[Firebase] ❌ No se obtuvo token')
      return null
    }

    if (typeof token !== 'string' || token.length < 100) {
      console.error('[Firebase] ❌ Token inválido (muy corto)')
      return null
    }

    console.log('[Firebase] ✅✅✅ TOKEN FCM OBTENIDO EXITOSAMENTE')
    console.log('[Firebase] Token length:', token.length)
    console.log('[Firebase] Token preview:', token.substring(0, 30) + '...')
    console.log('[Firebase] ====== PROCESO COMPLETADO ======')
    
    return token

  } catch (error: any) {
    console.error('[Firebase] ❌❌❌ ERROR CRÍTICO:', error)
    console.error('[Firebase] Error message:', error.message)
    console.error('[Firebase] Error stack:', error.stack)
    return null
  }
}

// ============================================================
// LISTENER PARA MENSAJES EN PRIMER PLANO
// ============================================================
export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {}
  
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app)
      onMessage(messaging, (payload) => {
        console.log('[Firebase] Mensaje en primer plano recibido:', payload)
        callback(payload)
      })
    }
  })
}

export { app }