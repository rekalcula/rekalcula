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

// Obtener token FCM
export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported) {
      console.log('[Firebase] Messaging no soportado en este navegador')
      return null
    }

    const messaging = getMessaging(app)
    
    // Solicitar permiso
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[Firebase] Permiso de notificaciones denegado')
      return null
    }

    // Obtener token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    })

    console.log('[Firebase] Token FCM obtenido')
    return token
  } catch (error) {
    console.error('[Firebase] Error obteniendo token:', error)
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