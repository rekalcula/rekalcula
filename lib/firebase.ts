
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

// Obtener token FCM - VERSIÓN SIN ESPERAR READY
export async function getFCMToken(): Promise<string | null> {
  try {
    // 1. Verificar soporte
    const supported = await isSupported()
    if (!supported) {
      console.error('[Firebase] Messaging no soportado')
      return null
    }

    // 2. Verificar VAPID Key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('[Firebase] ❌ VAPID Key no configurada')
      return null
    }
    console.log('[Firebase] ✅ VAPID Key encontrada')

    // 3. Solicitar permiso
    console.log('[Firebase] Solicitando permiso...')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.error('[Firebase] ❌ Permiso denegado')
      return null
    }
    console.log('[Firebase] ✅ Permiso concedido')

    // 4. Obtener messaging DIRECTAMENTE (sin registrar SW manualmente)
    console.log('[Firebase] Obteniendo messaging instance...')
    const messaging = getMessaging(app)
    console.log('[Firebase] ✅ Messaging obtenido')

    // 5. Solicitar token (Firebase maneja el SW internamente)
    console.log('[Firebase] Solicitando token FCM...')
    const token = await getToken(messaging, {
      vapidKey: vapidKey
    })

    // 6. Validar token
    if (!token) {
      console.error('[Firebase] ❌ No se obtuvo token')
      return null
    }

    if (typeof token !== 'string' || token.length < 100) {
      console.error('[Firebase] ❌ Token inválido')
      return null
    }

    console.log('[Firebase] ✅ Token FCM obtenido')
    console.log('[Firebase] Longitud:', token.length)
    
    return token

  } catch (error: any) {
    console.error('[Firebase] ❌ Error:', error.message)
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
