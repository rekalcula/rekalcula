// ============================================================
// API DE NOTIFICACIONES - DETECTA ALERTAS DE ALTA PRIORIDAD
// ============================================================

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import {
  agregarMetricas,
  calcularRangoFechas,
  detectarOportunidades
} from '@/lib/advisor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener datos del último mes
    const { inicioActual, finActual, inicioAnterior, finAnterior } = calcularRangoFechas('mes')

    const { data: ventasActuales } = await supabase
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

    if (!ventasActuales || ventasActuales.length === 0) {
      return NextResponse.json({
        success: true,
        hayNotificaciones: false,
        conteoAltaPrioridad: 0,
        notificaciones: []
      })
    }

    // Calcular métricas y detectar oportunidades
    const metricas = agregarMetricas(
      {
        ventasActuales: ventasActuales || [],
        ventasAnteriores: ventasAnteriores || []
      },
      'mes'
    )

    const oportunidades = detectarOportunidades(metricas, 10)

    // Filtrar solo alta prioridad (prioridad 1)
    const altaPrioridad = oportunidades.filter(o => o.prioridad === 1)

    // Crear notificaciones
    const notificaciones = altaPrioridad.map(o => ({
      id: o.id,
      tipo: 'alta_prioridad',
      titulo: getTituloNotificacion(o.tipo),
      mensaje: `${o.producto.nombre} requiere atención`,
      producto: o.producto.nombre,
      tendencia: o.producto.tendencia,
      principio: o.principio.nombre
    }))

    return NextResponse.json({
      success: true,
      hayNotificaciones: notificaciones.length > 0,
      conteoAltaPrioridad: notificaciones.length,
      notificaciones
    })

  } catch (error) {
    console.error('Error en API notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}

function getTituloNotificacion(tipo: string): string {
  const titulos: Record<string, string> = {
    'aumentar_visibilidad': '💡 Oportunidad de visibilidad',
    'investigar_declive': '⚠️ Producto en declive',
    'potenciar_estrella': '⭐ Producto estrella detectado',
    'evaluar_eliminacion': '🗑️ Producto a evaluar',
    'evaluar_subida_precio': '💰 Oportunidad de precio'
  }
  return titulos[tipo] || '📊 Nueva oportunidad'
}