// ============================================================
// API: PREFERENCIAS DE NOTIFICACIONES
// Ubicación: app/api/notifications/preferences/route.ts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// GET: Obtener preferencias del usuario
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

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Preferences] Error:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener preferencias' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: data?.preferences || null
    })

  } catch (error) {
    console.error('[Preferences] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST: Guardar preferencias del usuario
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
    const { preferences } = body

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Preferencias inválidas' },
        { status: 400 }
      )
    }

    // Upsert: insertar o actualizar
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )

    if (error) {
      console.error('[Preferences] Error al guardar:', error)
      return NextResponse.json(
        { success: false, error: 'Error al guardar preferencias' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferencias guardadas'
    })

  } catch (error) {
    console.error('[Preferences] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
