// ============================================================
// API DE EXPORTAR PDF - GENERA INFORME DE RECOMENDACIONES
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import {
  agregarMetricas,
  calcularRangoFechas,
  detectarOportunidades,
  generarRecomendacionesSinIA
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

    // Obtener datos
    const { inicioActual, finActual, inicioAnterior, finAnterior } = calcularRangoFechas(periodo)

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
        success: false,
        error: 'No hay datos para exportar'
      })
    }

    // Calcular mÃ©tricas
    const metricas = agregarMetricas(
      {
        ventasActuales: ventasActuales || [],
        ventasAnteriores: ventasAnteriores || []
      },
      periodo
    )

    // Detectar oportunidades
    const oportunidades = detectarOportunidades(metricas, 10)
    const recomendaciones = generarRecomendacionesSinIA(oportunidades)

    // Obtener historial
    const { data: historial } = await supabase
      .from('advisor_history')
      .select('*')
      .eq('user_id', userId)
      .eq('accion', 'aplicada')
      .order('created_at', { ascending: false })
      .limit(10)

    // Generar contenido HTML para el PDF
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const traducirPeriodo = (p: string) => {
      const t: Record<string, string> = { dia: 'Hoy', semana: 'Esta semana', mes: 'Este mes' }
      return t[p] || p
    }

    const traducirSector = (s: string) => {
      const t: Record<string, string> = {
        cafeteria: 'CafeterÃ­a', restaurante: 'Restaurante',
        peluqueria: 'PeluquerÃ­a', tienda: 'Tienda',
        taller: 'Taller', desconocido: 'Negocio'
      }
      return t[s] || s
    }

    const getPrioridadTexto = (p: number) => {
      const t: Record<number, string> = { 1: 'Alta', 2: 'Media', 3: 'Baja' }
      return t[p] || 'Normal'
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe de Asesoramiento - ReKalcula</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #E07A5F; }
    .header h1 { color: #E07A5F; font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; font-size: 18px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #ddd; }
    .info-box { background: #f8f8f8; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-label { color: #666; }
    .info-value { font-weight: 600; }
    .recommendation { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
    .recommendation.alta { border-left: 4px solid #ef4444; }
    .recommendation.media { border-left: 4px solid #f59e0b; }
    .recommendation.baja { border-left: 4px solid #22c55e; }
    .rec-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .rec-title { font-weight: 600; font-size: 16px; }
    .rec-priority { font-size: 12px; padding: 4px 8px; border-radius: 4px; }
    .rec-priority.alta { background: #fee2e2; color: #dc2626; }
    .rec-priority.media { background: #fef3c7; color: #d97706; }
    .rec-priority.baja { background: #dcfce7; color: #16a34a; }
    .rec-message { color: #555; margin-bottom: 10px; }
    .rec-principle { background: #eff6ff; padding: 10px; border-radius: 4px; font-size: 13px; color: #1e40af; }
    .metrics { display: flex; gap: 15px; margin-bottom: 10px; }
    .metric { background: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
    .no-data { text-align: center; padding: 40px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ðŸ’¡ Informe de Asesoramiento</h1>
    <p>ReKalcula - Generado el ${fechaActual}</p>
  </div>

  <div class="section">
    <h2>ðŸ“Š Resumen del AnÃ¡lisis</h2>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">PerÃ­odo analizado:</span>
        <span class="info-value">${traducirPeriodo(periodo)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Sector detectado:</span>
        <span class="info-value">${traducirSector(metricas.sector)} (${metricas.confianzaSector}% confianza)</span>
      </div>
      <div class="info-row">
        <span class="info-label">Productos analizados:</span>
        <span class="info-value">${metricas.totales.productosUnicos}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total ventas:</span>
        <span class="info-value">${metricas.totales.ventas} unidades</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total ingresos:</span>
        <span class="info-value">â‚¬${metricas.totales.ingresos.toFixed(2)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Recomendaciones generadas:</span>
        <span class="info-value">${recomendaciones.length}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>ðŸ’¡ Recomendaciones</h2>
    ${recomendaciones.length > 0 ? recomendaciones.map(rec => `
      <div class="recommendation ${rec.prioridad === 1 ? 'alta' : rec.prioridad === 2 ? 'media' : 'baja'}">
        <div class="rec-header">
          <span class="rec-title">${rec.titulo}</span>
          <span class="rec-priority ${rec.prioridad === 1 ? 'alta' : rec.prioridad === 2 ? 'media' : 'baja'}">
            Prioridad ${getPrioridadTexto(rec.prioridad)}
          </span>
        </div>
        <p class="rec-message">${rec.mensaje}</p>
        <div class="metrics">
          <span class="metric">ðŸ“¦ Ventas: ${rec.datosReales.ventas}</span>
          <span class="metric">ðŸ“Š Media: ${Math.round(rec.datosReales.mediaVentas)}</span>
          <span class="metric">ðŸ“ˆ Tendencia: ${rec.datosReales.tendencia > 0 ? '+' : ''}${rec.datosReales.tendencia}%</span>
        </div>
        <div class="rec-principle">
          <strong>ðŸ“š Principio:</strong> ${rec.principio.nombre} (${rec.principio.autor}, ${rec.principio.anio})
        </div>
      </div>
    `).join('') : '<p class="no-data">No se detectaron recomendaciones para este perÃ­odo.</p>'}
  </div>

  ${historial && historial.length > 0 ? `
  <div class="section">
    <h2>âœ… Recomendaciones Aplicadas Recientemente</h2>
    ${historial.map(h => `
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Producto:</span>
          <span class="info-value">${h.producto}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Principio:</span>
          <span class="info-value">${h.principio_nombre}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha:</span>
          <span class="info-value">${new Date(h.created_at).toLocaleDateString('es-ES')}</span>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>Este informe fue generado automÃ¡ticamente por ReKalcula.</p>
    <p>Las recomendaciones estÃ¡n basadas en principios de psicologÃ­a del consumidor con respaldo cientÃ­fico.</p>
  </div>
</body>
</html>
    `

    // Devolver HTML (el frontend lo convertirÃ¡ a PDF)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="informe-ReKalcula-${periodo}.html"`
      }
    })

  } catch (error) {
    console.error('Error en API export-pdf:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}