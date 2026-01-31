
// ============================================================
// API: NOTIFICACIONES ADMIN - app/api/admin/notifications/route.ts
// Envía push + email al administrador
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToMultiple } from '@/lib/firebase-admin'
import { sendEmailNotification } from '@/lib/email'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación (push + email) desde panel admin
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

    // ============================================================
    // 1. Obtener email del usuario desde Clerk
    // ============================================================
    let userEmail: string | null = null
    try {
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      userEmail = user.emailAddresses.find(
        (e: any) => e.id === user.primaryEmailAddressId
      )?.emailAddress || null
    } catch (err) {
      console.warn('[Admin Notif] No se pudo obtener email de Clerk:', err)
    }

    // ============================================================
    // 2. Push notifications
    // ============================================================
    let pushResult = { successCount: 0, failureCount: 0, invalidTokens: [] as string[] }

    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token, device_type, device_name')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!tokenError && tokens && tokens.length > 0) {
      const tokenStrings = tokens.map(t => t.token)
      pushResult = await sendPushToMultiple(
        tokenStrings,
        title,
        messageBody,
        { url: url || '/dashboard' }
      )

      if (pushResult.invalidTokens.length > 0) {
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .in('token', pushResult.invalidTokens)
      }
    }

    // ============================================================
    // 3. Email
    // ============================================================
    let emailResult: { success: boolean; messageId?: string; error?: string } = {
      success: false,
      error: 'No hay email registrado'
    }

    if (userEmail) {
      emailResult = await sendEmailNotification({
        to: userEmail,
        subject: title,
        body: messageBody,
        url: url || '/dashboard'
      })
    }

    // ============================================================
    // Respuesta unificada
    // ============================================================
    const pushSuccess = pushResult.successCount > 0
    const emailSuccess = emailResult.success

    return NextResponse.json({
      success: pushSuccess || emailSuccess,
      push: {
        success: pushSuccess,
        sent: pushResult.successCount,
        failed: pushResult.failureCount,
        noDevices: !tokens || tokens.length === 0
      },
      email: {
        success: emailSuccess,
        to: userEmail,
        messageId: emailResult.messageId,
        error: emailResult.error
      }
    })

  } catch (error) {
    console.error('[Admin Notifications] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
