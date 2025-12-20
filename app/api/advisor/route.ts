// ============================================================
// API DEL ASESOR - ENDPOINT PRINCIPAL
// ============================================================
//
// GET /api/advisor
//   - Obtiene datos de ventas
//   - Calcula métricas
//   - Detecta oportunidades
//   - Genera recomendaciones
//
// Query params:
//   - periodo: 'dia' | 'semana' | 'mes' (default: 'mes')
//   - usarIA: 'true' | 'false' (default: 'true')
//
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import {
  agregarMetricas,
  calcularRangoFechas,
  detectarOportunidades,
  hayDatosSuficientes,
  generarRecomendaciones,
  generarRecomendacionesSinIA,
  obtenerResumen,
  AdvisorResponse
} from '@/lib/advisor'

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --------------------------------------------------------
// GET: Obtener recomendaciones
// --------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // 2. Obtener parámetros
    const searchParams = request.nextUrl.searchParams
    const periodo = (searchParams.get('periodo') || 'mes') as 'dia' | 'semana' | 'mes'
    const usarIA = searchParams.get('usarIA') !== 'false'

    // 3. Calcular rangos de fecha
    const { inicioActual, finActual, inicioAnterior, finAnterior } = calcularRangoFechas(periodo)

    // 4. Obtener ventas del período actual
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
      console.error('Error obteniendo ventas actuales:', errorActuales)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo datos de ventas' },
        { status: 500 }
      )
    }

    // 5. Obtener ventas del período anterior (para tendencias)
    const { data: ventasAnteriores, error: errorAnteriores } = await supabase
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

    if (errorAnteriores) {
      console.error('Error obteniendo ventas anteriores:', errorAnteriores)
      // No es crítico, continuamos sin datos de tendencia
    }

    // 6. Verificar que hay datos
    if (!ventasActuales || ventasActuales.length === 0) {
      const response: AdvisorResponse = {
        success: true,
        sector: 'desconocido',
        confianzaSector: 0,
        periodo: traducirPeriodo(periodo),
        recomendaciones: [],
        sinRecomendaciones: true,
        mensaje: 'No hay ventas registradas en este período. Sube algunos tickets de venta para recibir recomendaciones personalizadas.'
      }
      return NextResponse.json(response)
    }

    // 7. Agregar métricas
    const metricas = agregarMetricas(
      {
        ventasActuales: ventasActuales || [],
        ventasAnteriores: ventasAnteriores || []
      },
      periodo
    )

    // 8. Verificar si hay datos suficientes
    const { suficientes, mensaje: mensajeDatos } = hayDatosSuficientes(metricas)
    
    if (!suficientes) {
      const response: AdvisorResponse = {
        success: true,
        sector: metricas.sector,
        confianzaSector: metricas.confianzaSector,
        periodo: traducirPeriodo(periodo),
        recomendaciones: [],
        sinRecomendaciones: true,
        mensaje: mensajeDatos
      }
      return NextResponse.json(response)
    }

    // 9. Detectar oportunidades
    const oportunidades = detectarOportunidades(metricas, 5)

    // 10. Si no hay oportunidades
    if (oportunidades.length === 0) {
      const response: AdvisorResponse = {
        success: true,
        sector: metricas.sector,
        confianzaSector: metricas.confianzaSector,
        periodo: traducirPeriodo(periodo),
        recomendaciones: [],
        sinRecomendaciones: true,
        mensaje: 'No se detectaron oportunidades claras con los datos actuales. Esto puede significar que tu negocio está bien equilibrado o que necesitamos más datos para un análisis preciso.'
      }
      return NextResponse.json(response)
    }

    // 11. Generar recomendaciones
    let recomendaciones
    
    if (usarIA) {
      try {
        recomendaciones = await generarRecomendaciones(oportunidades, true)
      } catch (error) {
        console.error('Error con IA, usando fallback:', error)
        recomendaciones = generarRecomendacionesSinIA(oportunidades)
      }
    } else {
      recomendaciones = generarRecomendacionesSinIA(oportunidades)
    }

    // 12. Obtener resumen
    const resumen = obtenerResumen(oportunidades)

    // 13. Construir respuesta
    const response: AdvisorResponse = {
      success: true,
      sector: metricas.sector,
      confianzaSector: metricas.confianzaSector,
      periodo: traducirPeriodo(periodo),
      recomendaciones,
      sinRecomendaciones: false,
      mensaje: mensajeDatos || undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error en API advisor:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// --------------------------------------------------------
// Función auxiliar: Traducir período
// --------------------------------------------------------
function traducirPeriodo(periodo: 'dia' | 'semana' | 'mes'): string {
  const traducciones = {
    dia: 'Hoy',
    semana: 'Esta semana',
    mes: 'Este mes'
  }
  return traducciones[periodo]
}