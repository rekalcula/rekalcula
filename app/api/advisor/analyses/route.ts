import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener lista de análisis guardados
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('advisor_analyses')
      .select('id, created_at, periodo, sector, total_ventas, total_ingresos, num_recomendaciones')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, analyses: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Guardar un nuevo análisis
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { periodo, sector, totalVentas, totalIngresos, recomendaciones, resumen } = body

    const { data, error } = await supabase
      .from('advisor_analyses')
      .insert({
        user_id: userId,
        periodo,
        sector,
        total_ventas: totalVentas || 0,
        total_ingresos: totalIngresos || 0,
        num_recomendaciones: recomendaciones?.length || 0,
        recomendaciones: recomendaciones || [],
        resumen: resumen || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, analysis: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: Borrar análisis (uno o varios)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')

    if (!ids) {
      return NextResponse.json({ success: false, error: 'IDs requeridos' }, { status: 400 })
    }

    const idsArray = ids.split(',')

    const { error } = await supabase
      .from('advisor_analyses')
      .delete()
      .eq('user_id', userId)
      .in('id', idsArray)

    if (error) throw error

    return NextResponse.json({ success: true, deleted: idsArray.length })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
