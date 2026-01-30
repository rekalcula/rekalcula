// ============================================================
// FIREBASE ADMIN SDK - Envío de Push Notifications
// ============================================================

import admin from 'firebase-admin'

// Inicializar Firebase Admin (singleton)
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials not configured')
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

// ============================================================
// ENVIAR NOTIFICACIÓN A UN TOKEN
// ============================================================
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    getFirebaseAdmin()
    
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          requireInteraction: true,
        },
        fcmOptions: {
          link: '/dashboard',
        },
      },
      data: data || {},
    }

    const response = await admin.messaging().send(message)
    console.log('[Firebase] Notificación enviada:', response)
    
    return { success: true, messageId: response }
  } catch (error: any) {
    console.error('[Firebase] Error enviando notificación:', error)
    
    // Detectar token inválido
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      return { success: false, error: 'token_invalid' }
    }
    
    return { success: false, error: error.message }
  }
}

// ============================================================
// ENVIAR NOTIFICACIÓN A MÚLTIPLES TOKENS
// ============================================================
export async function sendPushToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ 
  success: boolean
  successCount: number
  failureCount: number
  invalidTokens: string[]
}> {
  try {
    getFirebaseAdmin()

    if (tokens.length === 0) {
      return { success: true, successCount: 0, failureCount: 0, invalidTokens: [] }
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.svg',
          badge: '/icons/icon-72x72.svg',
          requireInteraction: true,
        },
        fcmOptions: {
          link: '/dashboard',
        },
      },
      data: data || {},
    }

    const response = await admin.messaging().sendEachForMulticast(message)
    
    // Identificar tokens inválidos
    const invalidTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        if (resp.error?.code === 'messaging/registration-token-not-registered' ||
            resp.error?.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[idx])
        }
        console.error('[Firebase] Error en token:', tokens[idx], resp.error)
      }
    })

    console.log(`[Firebase] Enviadas: ${response.successCount}/${tokens.length}`)

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    }
  } catch (error: any) {
    console.error('[Firebase] Error enviando notificaciones:', error)
    return { 
      success: false, 
      successCount: 0, 
      failureCount: tokens.length, 
      invalidTokens: [] 
    }
  }
}

// ============================================================
// ENVIAR NOTIFICACIÓN A UN USUARIO (TODOS SUS DISPOSITIVOS)
// ============================================================
import { createClient } from '@supabase/supabase-js'

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: boolean; devicesNotified: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener todos los tokens activos del usuario
  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !tokens || tokens.length === 0) {
    console.log('[Firebase] No hay tokens para el usuario:', userId)
    return { success: false, devicesNotified: 0 }
  }

  const tokenStrings = tokens.map(t => t.token)
  const result = await sendPushToMultiple(tokenStrings, title, body, data)

  // Desactivar tokens inválidos
  if (result.invalidTokens.length > 0) {
    await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .in('token', result.invalidTokens)
  }

  return { 
    success: result.success, 
    devicesNotified: result.successCount 
  }
}
