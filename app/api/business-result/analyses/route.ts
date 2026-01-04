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
      .from('business_result_analyses')
      .select('id, created_at, periodo, fecha_inicio, fecha_fin, ingresos_brutos, total_costos, beneficio_neto_real, tipo_entidad')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, analyses: data || [] })
  } catch (error: any) {
    console.error('Error en GET /api/business-result/analyses:', error)
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
    const { analysisData } = body

    if (!analysisData) {
      return NextResponse.json({ success: false, error: 'Datos del análisis requeridos' }, { status: 400 })
    }

    // Extraer fecha_inicio y fecha_fin del período si está en formato de rango
    let fecha_inicio = null
    let fecha_fin = null
    
    // Si el período es un mes específico, calculamos las fechas
    if (analysisData.periodo) {
      const now = new Date()
      fecha_inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      fecha_fin = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('business_result_analyses')
      .insert({
        user_id: userId,
        periodo: analysisData.periodo || 'Sin período',
        fecha_inicio,
        fecha_fin,
        ingresos_brutos: analysisData.ingresosBrutos || 0,
        total_costos: analysisData.totalCostos || 0,
        beneficio_neto_real: analysisData.beneficioNetoReal || 0,
        tipo_entidad: analysisData.configFiscal?.tipoEntidad || 'autonomo',
        analysis_data: analysisData
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, analysis: data })
  } catch (error: any) {
    console.error('Error en POST /api/business-result/analyses:', error)
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
      .from('business_result_analyses')
      .delete()
      .eq('user_id', userId)
      .in('id', idsArray)

    if (error) throw error

    return NextResponse.json({ success: true, deleted: idsArray.length })
  } catch (error: any) {
    console.error('Error en DELETE /api/business-result/analyses:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}