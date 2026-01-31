
// ============================================================
// API: ENVIAR NOTIFICACIÓN PUSH - app/api/notifications/send/route.ts
// Envía push + email (si está habilitado en preferencias)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification, sendPushToMultiple } from '@/lib/firebase-admin'
import { sendEmailNotification } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación al usuario actual (push + email)
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

    // ============================================================
    // 1. Push notifications
    // ============================================================
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('is_active', true)

    let pushResult = { successCount: 0, failureCount: 0, invalidTokens: [] as string[] }

    if (!tokenError && tokens && tokens.length > 0) {
      const tokenStrings = tokens.map(t => t.token)
      pushResult = await sendPushToMultiple(
        tokenStrings,
        title,
        messageBody,
        { url: url || '/dashboard', ...data }
      )

      if (pushResult.invalidTokens.length > 0) {
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .in('token', pushResult.invalidTokens)
      }
    }

    // ============================================================
    // 2. Email — verificar preferencia del usuario
    // ============================================================
    let emailResult: { success: boolean; error?: string } = { success: false }

    // Comprobar si el usuario tiene email habilitado en preferencias
    const { data: prefData } = await supabase
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    const emailEnabled = prefData?.preferences?.emailEnabled !== false // default: true

    if (emailEnabled) {
      try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const userEmail = user.emailAddresses.find(
          (e: any) => e.id === user.primaryEmailAddressId
        )?.emailAddress

        if (userEmail) {
          emailResult = await sendEmailNotification({
            to: userEmail,
            subject: title,
            body: messageBody,
            url: url || '/dashboard'
          })
        }
      } catch (err) {
        console.warn('[Send Notif] Error enviando email:', err)
      }
    }

    return NextResponse.json({
      success: pushResult.successCount > 0 || emailResult.success,
      push: {
        sent: pushResult.successCount,
        failed: pushResult.failureCount,
        totalDevices: tokens?.length || 0
      },
      email: {
        success: emailResult.success,
        enabled: emailEnabled
      }
    })

  } catch (error) {
    console.error('[Send Notification] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
