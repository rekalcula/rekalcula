// ============================================================
// API: ENVIAR NOTIFICACIÓN PUSH - app/api/notifications/send/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification, sendPushToMultiple } from '@/lib/firebase-admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación al usuario actual
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, body: messageBody, url, data } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Título y mensaje requeridos' },
        { status: 400 }
      )
    }

    // Obtener todos los tokens activos del usuario
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (tokenError || !tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay dispositivos registrados para notificaciones',
        devicesCount: 0
      })
    }

    // Enviar a todos los dispositivos del usuario
    const tokenStrings = tokens.map(t => t.token)
    const result = await sendPushToMultiple(
      tokenStrings,
      title,
      messageBody,
      {
        url: url || '/dashboard',
        ...data
      }
    )

    // Desactivar tokens inválidos
    if (result.invalidTokens.length > 0) {
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
    }

    return NextResponse.json({
      success: result.successCount > 0,
      sent: result.successCount,
      failed: result.failureCount,
      totalDevices: tokens.length
    })

  } catch (error) {
    console.error('[Send Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
