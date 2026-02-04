// ============================================================
// FIREBASE CLIENT SDK - lib/firebase.ts  
// VERSIÓN CORREGIDA: Solicitar permiso PRIMERO (crítico para Android)
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
// REGISTRAR SERVICE WORKER
// ============================================================
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!('serviceWorker' in navigator)) {
      console.error('[Firebase] Service Worker no soportado')
      return null
    }

    console.log('[Firebase] Registrando Service Worker...')
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    })

    console.log('[Firebase] ✅ Service Worker registrado')

    await navigator.serviceWorker.ready
    console.log('[Firebase] ✅ Service Worker activo y listo')

    return registration

  } catch (error: any) {
    console.error('[Firebase] ❌ Error registrando SW:', error.message)
    return null
  }
}

// ============================================================
// OBTENER TOKEN FCM - VERSIÓN CORREGIDA PARA ANDROID
// El permiso se solicita PRIMERO, antes de cualquier operación asíncrona
// ============================================================
export async function getFCMToken(): Promise<string | null> {
  try {
    console.log('[Firebase] ====== INICIANDO PROCESO ======')

    // 1. Verificar soporte básico (síncrono)
    if (typeof window === 'undefined') {
      console.error('[Firebase] ❌ No hay window')
      return null
    }

    if (!('Notification' in window)) {
      console.error('[Firebase] ❌ Notification API no soportada')
      return null
    }

    // 2. ⚠️ CRÍTICO PARA ANDROID: Solicitar permiso INMEDIATAMENTE
    // Debe ser lo primero después del click del usuario
    console.log('[Firebase] Verificando estado del permiso...')
    let permission = Notification.permission
    console.log('[Firebase] Permiso actual:', permission)

    if (permission === 'default') {
      console.log('[Firebase] Solicitando permiso al usuario...')
      permission = await Notification.requestPermission()
      console.log('[Firebase] Respuesta del usuario:', permission)
    }

    if (permission !== 'granted') {
      console.error('[Firebase] ❌ Permiso denegado o no concedido')
      return null
    }
    console.log('[Firebase] ✅ Permiso concedido')

    // 3. Ahora sí verificar soporte de Firebase Messaging (asíncrono)
    const supported = await isSupported()
    if (!supported) {
      console.error('[Firebase] ❌ Firebase Messaging no soportado')
      return null
    }
    console.log('[Firebase] ✅ Firebase Messaging soportado')

    // 4. Verificar VAPID Key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('[Firebase] ❌ VAPID Key no configurada')
      return null
    }
    console.log('[Firebase] ✅ VAPID Key encontrada')

    // 5. Registrar Service Worker (ahora ya tenemos permiso)
    const swRegistration = await registerServiceWorker()
    if (!swRegistration) {
      console.error('[Firebase] ❌ No se pudo registrar Service Worker')
      return null
    }

    // 6. Obtener messaging instance
    console.log('[Firebase] Obteniendo messaging instance...')
    const messaging = getMessaging(app)
    console.log('[Firebase] ✅ Messaging instance obtenida')

    // 7. Solicitar token FCM
    console.log('[Firebase] Solicitando token FCM...')
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: swRegistration
    })

    // 8. Validar token
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