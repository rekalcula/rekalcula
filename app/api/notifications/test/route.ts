// ============================================================
// API: TEST NOTIFICACIÓN - app/api/notifications/test/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/lib/firebase-admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación de prueba
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

    // Obtener el primer token activo del usuario
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token, device_type, device_name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({
        success: false,
        error: 'No tienes dispositivos registrados para notificaciones. Activa las notificaciones primero.',
        step: 'no_token'
      })
    }

    // Enviar notificación de prueba
    const result = await sendPushNotification(
      tokenData.token,
      '🎉 ¡Notificaciones activas!',
      'Las notificaciones push de ReKalcula funcionan correctamente.',
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    )

    if (!result.success) {
      // Si el token es inválido, desactivarlo
      if (result.error === 'token_invalid') {
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .eq('token', tokenData.token)
        
        return NextResponse.json({
          success: false,
          error: 'El token del dispositivo ya no es válido. Por favor, reactiva las notificaciones.',
          step: 'token_expired'
        })
      }

      return NextResponse.json({
        success: false,
        error: result.error || 'Error al enviar notificación',
        step: 'send_failed'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación de prueba enviada',
      device: tokenData.device_name || tokenData.device_type,
      messageId: result.messageId
    })

  } catch (error) {
    console.error('[Test Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================================
// GET: Estado de notificaciones del usuario
// ============================================================
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Contar dispositivos registrados
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('id, device_type, device_name, is_active, created_at')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Error al obtener dispositivos'
      })
    }

    const activeDevices = tokens?.filter(t => t.is_active) || []
    const inactiveDevices = tokens?.filter(t => !t.is_active) || []

    return NextResponse.json({
      success: true,
      notificationsEnabled: activeDevices.length > 0,
      activeDevices: activeDevices.length,
      inactiveDevices: inactiveDevices.length,
      devices: activeDevices.map(d => ({
        type: d.device_type,
        name: d.device_name,
        registeredAt: d.created_at
      }))
    })

  } catch (error) {
    console.error('[Test Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
