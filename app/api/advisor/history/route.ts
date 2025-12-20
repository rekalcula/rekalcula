// ============================================================
// API DE HISTORIAL - GUARDA ACCIONES DEL USUARIO
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --------------------------------------------------------
// GET: Obtener historial de recomendaciones
// --------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limite = parseInt(searchParams.get('limite') || '50')
    const accion = searchParams.get('accion') // 'aplicada', 'descartada', o null para todas

    let query = supabase
      .from('advisor_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limite)

    if (accion) {
      query = query.eq('accion', accion)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo historial:', error)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo historial' },
        { status: 500 }
      )
    }

    // Calcular estadísticas
    const { data: stats } = await supabase
      .from('advisor_history')
      .select('accion')
      .eq('user_id', userId)

    const totalAplicadas = stats?.filter(s => s.accion === 'aplicada').length || 0
    const totalDescartadas = stats?.filter(s => s.accion === 'descartada').length || 0

    return NextResponse.json({
      success: true,
      historial: data,
      estadisticas: {
        totalAplicadas,
        totalDescartadas,
        total: totalAplicadas + totalDescartadas
      }
    })

  } catch (error) {
    console.error('Error en API history GET:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// --------------------------------------------------------
// POST: Guardar acción del usuario
// --------------------------------------------------------
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
    const { recomendacion, accion } = body

    if (!recomendacion || !accion) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    if (!['aplicada', 'descartada'].includes(accion)) {
      return NextResponse.json(
        { success: false, error: 'Acción inválida' },
        { status: 400 }
      )
    }

    // Guardar en historial
    const { data, error } = await supabase
      .from('advisor_history')
      .insert({
        user_id: userId,
        recommendation_id: recomendacion.id,
        producto: recomendacion.producto,
        tipo_oportunidad: recomendacion.tipo || 'desconocido',
        principio_id: recomendacion.principio?.id || '',
        principio_nombre: recomendacion.principio?.nombre || '',
        prioridad: recomendacion.prioridad,
        mensaje: recomendacion.mensaje,
        datos_ventas: recomendacion.datosReales?.ventas,
        datos_media_ventas: recomendacion.datosReales?.mediaVentas,
        datos_tendencia: recomendacion.datosReales?.tendencia,
        datos_ingresos: recomendacion.datosReales?.ingresos,
        sector: recomendacion.sector,
        accion,
        fecha_generacion: recomendacion.fechaGeneracion
      })
      .select()
      .single()

    if (error) {
      console.error('Error guardando historial:', error)
      return NextResponse.json(
        { success: false, error: 'Error guardando historial' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Recomendación marcada como ${accion}`,
      registro: data
    })

  } catch (error) {
    console.error('Error en API history POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

// --------------------------------------------------------
// DELETE: Eliminar registro del historial
// --------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('advisor_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error eliminando registro:', error)
      return NextResponse.json(
        { success: false, error: 'Error eliminando registro' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Registro eliminado'
    })

  } catch (error) {
    console.error('Error en API history DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}