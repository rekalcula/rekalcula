// ============================================================
// API: REGISTRAR TOKEN PUSH - app/api/notifications/register-token/route.ts
// ============================================================
// CAMBIO CLAVE: Antes de registrar un nuevo token, desactiva
// todos los tokens anteriores del mismo usuario + device_type.
// Esto evita que se acumulen tokens duplicados y se envíen
// notificaciones repetidas al mismo dispositivo.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// POST: Registrar nuevo token
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
    const { token, deviceType, deviceName } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    const dtype = deviceType || 'web'
    const dname = deviceName || 'Navegador'

    // =========================================================
    // PASO 1: Desactivar tokens anteriores del mismo dispositivo
    // =========================================================
    // Cuando el usuario borra caché o el token se renueva,
    // el token viejo queda en la BD como activo pero ya no sirve.
    // Firebase intenta enviar a ambos → notificación duplicada
    // (una llega, la del token viejo falla silenciosamente o
    //  a veces ambas llegan si el token aún es válido brevemente).
    // =========================================================
    const { error: deactivateError } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('device_type', dtype)
      .neq('token', token)  // No desactivar el token actual si ya existe

    if (deactivateError) {
      console.warn('[Register Token] Error desactivando tokens antiguos:', deactivateError)
      // No bloqueamos, seguimos con el registro
    }

    // =========================================================
    // PASO 2: Upsert del nuevo token
    // =========================================================
    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token: token,
          device_type: dtype,
          device_name: dname,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error('[Register Token] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Error al guardar token' },
        { status: 500 }
      )
    }

    console.log(`[Register Token] Token ${dtype}/${dname} registrado para usuario: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Token registrado correctamente',
      tokenId: data?.id
    })

  } catch (error) {
    console.error('[Register Token] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================================
// DELETE: Desactivar token
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('token', token)

    if (error) {
      console.error('[Register Token] Error al desactivar:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Token desactivado'
    })

  } catch (error) {
    console.error('[Register Token] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}