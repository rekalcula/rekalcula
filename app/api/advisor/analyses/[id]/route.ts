import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔒 VALIDACIÓN
function isValidUUID(value: any): boolean {
  if (!value || typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'ID no válido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('advisor_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Analisis no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, analysis: data })
  } catch (error: any) {
    console.error('Error en GET advisor/analyses/[id]')
    return NextResponse.json(
      { success: false, error: 'Error al obtener análisis' },
      { status: 500 }
    )
  }
}