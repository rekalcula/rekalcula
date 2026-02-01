// ============================================================
// API: ENVIAR NOTIFICACIÓN PUSH - app/api/admin/notifications/route.ts
// Envía push + email (si está habilitado en preferencias)
// Soporta envío dirigido a usuarios específicos (solo admin)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification, sendPushToMultiple, sendPushToUser } from '@/lib/firebase-admin'
import { sendEmailNotification } from '@/lib/email'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Enviar notificación
// ─ Sin targetUserIds → envía al usuario actual (push + email)
// ─ Con targetUserIds → envía solo push a cada usuario (solo admin)
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
    const { title, body: messageBody, url, data, targetUserIds } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Título y mensaje requeridos' },
        { status: 400 }
      )
    }

    // ============================================================
    // BLOQUE A: Envío dirigido a usuarios específicos (solo admin)
    // ============================================================
    if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {

      if (!isAdmin(userId)) {
        return NextResponse.json(
          { success: false, error: 'Solo administradores pueden enviar a otros usuarios' },
          { status: 403 }
        )
      }

      // Enviar push a cada usuario en paralelo
      const results = await Promise.all(
        targetUserIds.map(async (targetId: string) => {
          try {
            const result = await sendPushToUser(
              targetId,
              title,
              messageBody,
              { url: url || '/dashboard' }
            )
            return {
              userId: targetId,
              success: result.success,
              devicesNotified: result.devicesNotified
            }
          } catch (err) {
            console.error(`[Send Notif] Error para usuario ${targetId}:`, err)
            return { userId: targetId, success: false, devicesNotified: 0 }
          }
        })
      )

      const totalDevices  = results.reduce((sum, r) => sum + r.devicesNotified, 0)
      const notifiedUsers = results.filter(r => r.devicesNotified > 0).length
      const noDeviceUsers = results.filter(r => r.devicesNotified === 0).length

      console.log(`[Send Notif] Dirigido: ${notifiedUsers}/${targetUserIds.length} usuarios, ${totalDevices} dispositivos`)

      return NextResponse.json({
        success: totalDevices > 0,
        push: {
          sent: totalDevices,
          failed: noDeviceUsers,
          totalDevices,
          targeted: targetUserIds.length,
          notified: notifiedUsers,
          noDevices: noDeviceUsers === targetUserIds.length
        },
        email: {
          success: false,
          to: null,
          error: 'No disponible en envío dirigido'
        }
      })
    }

    // ============================================================
    // BLOQUE B: Envío al usuario actual (comportamiento original)
    // ============================================================

    // 1. Push notifications
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

    // 2. Email — verificar preferencia del usuario
    let emailResult: { success: boolean; error?: string } = { success: false }

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
        totalDevices: tokens?.length || 0,
        noDevices: !tokens || tokens.length === 0
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