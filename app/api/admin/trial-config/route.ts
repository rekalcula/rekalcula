import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { isAdmin } from '@/lib/admin'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener configuración actual del trial
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es admin
    const hasAccess = await isAdmin(userId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener configuración activa
    const { data, error } = await supabase
      .from('trial_config')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching trial config:', error)
      return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
    }

    // Si no existe configuración, crear una por defecto
    if (!data) {
      const { data: newConfig, error: createError } = await supabase
        .from('trial_config')
        .insert({
          invoices_limit: 10,
          tickets_limit: 10,
          analyses_limit: 5,
          trial_days: 7,
          description: 'Configuración inicial de trial',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating default config:', createError)
        return NextResponse.json({ error: 'Error al crear configuración' }, { status: 500 })
      }

      return NextResponse.json({ success: true, config: newConfig })
    }

    return NextResponse.json({ success: true, config: data })

  } catch (error) {
    console.error('Error in trial-config GET:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar configuración del trial
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es admin
    const hasAccess = await isAdmin(userId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { invoices_limit, tickets_limit, analyses_limit, trial_days, description } = body

    // Validaciones
    if (invoices_limit < 0 || invoices_limit > 100) {
      return NextResponse.json({ error: 'Límite de facturas inválido (0-100)' }, { status: 400 })
    }
    if (tickets_limit < 0 || tickets_limit > 100) {
      return NextResponse.json({ error: 'Límite de tickets inválido (0-100)' }, { status: 400 })
    }
    if (analyses_limit < 0 || analyses_limit > 50) {
      return NextResponse.json({ error: 'Límite de análisis inválido (0-50)' }, { status: 400 })
    }
    if (trial_days < 1 || trial_days > 30) {
      return NextResponse.json({ error: 'Días de trial inválidos (1-30)' }, { status: 400 })
    }

    // Desactivar configuraciones anteriores
    await supabase
      .from('trial_config')
      .update({ is_active: false })
      .eq('is_active', true)

    // Crear nueva configuración
    const { data: newConfig, error } = await supabase
      .from('trial_config')
      .insert({
        invoices_limit,
        tickets_limit,
        analyses_limit,
        trial_days,
        description: description || '',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating trial config:', error)
      return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
    }

    return NextResponse.json({ success: true, config: newConfig })

  } catch (error) {
    console.error('Error in trial-config PUT:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
