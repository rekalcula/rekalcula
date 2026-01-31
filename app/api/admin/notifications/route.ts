
// ============================================================
// API: NOTIFICACIONES ADMIN - app/api/admin/notifications/route.ts
// Envía notificaciones push al administrador para pruebas
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToMultiple } from '@/lib/firebase-admin'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación de prueba desde panel admin
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, body: messageBody, url } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Título y mensaje requeridos' },
        { status: 400 }
      )
    }

    // Obtener tokens activos del administrador
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token, device_type, device_name')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (tokenError || !tokens || tokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay dispositivos registrados. Activa las notificaciones en Dashboard → Notificaciones.'
      })
    }

    // Enviar a todos los dispositivos del admin
    const tokenStrings = tokens.map(t => t.token)
    const result = await sendPushToMultiple(
      tokenStrings,
      title,
      messageBody,
      { url: url || '/dashboard' }
    )

    // Desactivar tokens inválidos automáticamente
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
      devices: tokens.map(t => ({
        type: t.device_type,
        name: t.device_name
      }))
    })

  } catch (error) {
    console.error('[Admin Notifications] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
