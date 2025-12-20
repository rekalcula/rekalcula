// ============================================================
// API DE MÉTRICAS - ENDPOINT PARA DEBUG Y ESTADÍSTICAS
// ============================================================
//
// GET /api/advisor/metrics
//   - Devuelve métricas calculadas sin recomendaciones
//   - Útil para debugging y mostrar estadísticas
//
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import {
  agregarMetricas,
  calcularRangoFechas
} from '@/lib/advisor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const periodo = (searchParams.get('periodo') || 'mes') as 'dia' | 'semana' | 'mes'

    const { inicioActual, finActual, inicioAnterior, finAnterior } = calcularRangoFechas(periodo)

    // Obtener ventas actuales
    const { data: ventasActuales, error: errorActuales } = await supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total,
        sale_items (
          product_name,
          quantity,
          unit_price,
          total
        )
      `)
      .eq('user_id', userId)
      .gte('sale_date', inicioActual.toISOString().split('T')[0])
      .lte('sale_date', finActual.toISOString().split('T')[0])

    if (errorActuales) {
      return NextResponse.json(
        { success: false, error: 'Error obteniendo datos' },
        { status: 500 }
      )
    }

    // Obtener ventas anteriores
    const { data: ventasAnteriores } = await supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total,
        sale_items (
          product_name,
          quantity,
          unit_price,
          total
        )
      `)
      .eq('user_id', userId)
      .gte('sale_date', inicioAnterior.toISOString().split('T')[0])
      .lte('sale_date', finAnterior.toISOString().split('T')[0])

    // Calcular métricas
    const metricas = agregarMetricas(
      {
        ventasActuales: ventasActuales || [],
        ventasAnteriores: ventasAnteriores || []
      },
      periodo
    )

    return NextResponse.json({
      success: true,
      periodo,
      fechas: {
        actual: {
          inicio: inicioActual.toISOString().split('T')[0],
          fin: finActual.toISOString().split('T')[0]
        },
        anterior: {
          inicio: inicioAnterior.toISOString().split('T')[0],
          fin: finAnterior.toISOString().split('T')[0]
        }
      },
      metricas
    })

  } catch (error) {
    console.error('Error en API metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}