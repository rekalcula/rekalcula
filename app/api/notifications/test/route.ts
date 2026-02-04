// ============================================================
// API: TEST NOTIFICACIÓN - app/api/notifications/test/route.ts
// VERSIÓN CORREGIDA: Envía a TODOS los dispositivos del usuario
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
// POST: Enviar notificación de prueba A TODOS LOS DISPOSITIVOS
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

    // Obtener TODOS los tokens activos del usuario (no solo 1)
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token, device_type, device_name')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (tokenError || !tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No tienes dispositivos registrados para notificaciones. Activa las notificaciones primero.',
        step: 'no_token'
      })
    }

    // Enviar a TODOS los dispositivos del usuario
    const tokenStrings = tokens.map(t => t.token)
    
    const result = await sendPushToMultiple(
      tokenStrings,
      '🎉 ¡Notificaciones activas!',
      'Las notificaciones push de ReKalcula funcionan correctamente.',
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    )

    // Desactivar tokens inválidos automáticamente
    if (result.invalidTokens.length > 0) {
      await supabase
        .from('push_tokens')
        .update({ is_active: false })
        .in('token', result.invalidTokens)
      
      console.log(`[Test Notification] Desactivados ${result.invalidTokens.length} tokens inválidos`)
    }

    if (!result.success && result.successCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo enviar a ningún dispositivo. Por favor, reactiva las notificaciones.',
        step: 'send_failed'
      })
    }

    return NextResponse.json({
      success: true,
      message: `Notificación enviada a ${result.successCount} dispositivo(s)`,
      devicesNotified: result.successCount,
      devicesFailed: result.failureCount,
      devices: tokens.map(t => t.device_name || t.device_type)
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