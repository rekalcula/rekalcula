// ============================================================
// API DE IMPACTO - CALCULA MEJORAS DESPUÉS DE APLICAR CONSEJOS
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

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

    // 1. Obtener recomendaciones aplicadas
    const { data: aplicadas, error: errorAplicadas } = await supabase
      .from('advisor_history')
      .select('*')
      .eq('user_id', userId)
      .eq('accion', 'aplicada')
      .order('created_at', { ascending: true })

    if (errorAplicadas) {
      throw errorAplicadas
    }

    if (!aplicadas || aplicadas.length === 0) {
      return NextResponse.json({
        success: true,
        tienesDatos: false,
        mensaje: 'Aún no has aplicado ninguna recomendación. Aplica algunas y vuelve para ver el impacto.'
      })
    }

    // 2. Para cada producto con recomendación aplicada, comparar ventas antes/después
    const impactos = []

    for (const rec of aplicadas) {
      const fechaAplicacion = new Date(rec.created_at)
      
      // Ventas 30 días ANTES de aplicar
      const inicioAntes = new Date(fechaAplicacion)
      inicioAntes.setDate(inicioAntes.getDate() - 30)
      
      const { data: ventasAntes } = await supabase
        .from('sales')
        .select(`
          sale_items (
            product_name,
            quantity,
            total
          )
        `)
        .eq('user_id', userId)
        .gte('sale_date', inicioAntes.toISOString().split('T')[0])
        .lt('sale_date', fechaAplicacion.toISOString().split('T')[0])

      // Ventas 30 días DESPUÉS de aplicar
      const finDespues = new Date(fechaAplicacion)
      finDespues.setDate(finDespues.getDate() + 30)
      const ahora = new Date()
      const fechaFin = finDespues > ahora ? ahora : finDespues

      const { data: ventasDespues } = await supabase
        .from('sales')
        .select(`
          sale_items (
            product_name,
            quantity,
            total
          )
        `)
        .eq('user_id', userId)
        .gte('sale_date', fechaAplicacion.toISOString().split('T')[0])
        .lte('sale_date', fechaFin.toISOString().split('T')[0])

      // Calcular ventas del producto específico
      const productoNombre = rec.producto.toLowerCase()
      
      let cantidadAntes = 0
      let ingresosAntes = 0
      ventasAntes?.forEach(venta => {
        venta.sale_items?.forEach((item: any) => {
          if (item.product_name?.toLowerCase().includes(productoNombre) ||
              productoNombre.includes(item.product_name?.toLowerCase())) {
            cantidadAntes += item.quantity || 0
            ingresosAntes += item.total || 0
          }
        })
      })

      let cantidadDespues = 0
      let ingresosDespues = 0
      ventasDespues?.forEach(venta => {
        venta.sale_items?.forEach((item: any) => {
          if (item.product_name?.toLowerCase().includes(productoNombre) ||
              productoNombre.includes(item.product_name?.toLowerCase())) {
            cantidadDespues += item.quantity || 0
            ingresosDespues += item.total || 0
          }
        })
      })

      // Calcular días transcurridos desde aplicación
      const diasTranscurridos = Math.floor((ahora.getTime() - fechaAplicacion.getTime()) / (1000 * 60 * 60 * 24))

      // Calcular cambio porcentual
      const cambioCantidad = cantidadAntes > 0 
        ? Math.round(((cantidadDespues - cantidadAntes) / cantidadAntes) * 100)
        : (cantidadDespues > 0 ? 100 : 0)
      
      const cambioIngresos = ingresosAntes > 0
        ? Math.round(((ingresosDespues - ingresosAntes) / ingresosAntes) * 100)
        : (ingresosDespues > 0 ? 100 : 0)

      impactos.push({
        id: rec.id,
        producto: rec.producto,
        principio: rec.principio_nombre,
        fechaAplicacion: rec.created_at,
        diasTranscurridos,
        antes: {
          cantidad: cantidadAntes,
          ingresos: Math.round(ingresosAntes * 100) / 100
        },
        despues: {
          cantidad: cantidadDespues,
          ingresos: Math.round(ingresosDespues * 100) / 100
        },
        cambio: {
          cantidad: cambioCantidad,
          ingresos: cambioIngresos
        },
        tendencia: cambioCantidad > 10 ? 'positiva' : cambioCantidad < -10 ? 'negativa' : 'estable'
      })
    }

    // 3. Calcular resumen global
    const totalMejoradas = impactos.filter(i => i.cambio.cantidad > 0).length
    const totalEmpeoradas = impactos.filter(i => i.cambio.cantidad < 0).length
    const totalEstables = impactos.filter(i => i.cambio.cantidad === 0).length

    const promedioMejora = impactos.length > 0
      ? Math.round(impactos.reduce((sum, i) => sum + i.cambio.cantidad, 0) / impactos.length)
      : 0

    return NextResponse.json({
      success: true,
      tienesDatos: true,
      resumen: {
        totalRecomendacionesAplicadas: aplicadas.length,
        productosAnalizados: impactos.length,
        mejoradas: totalMejoradas,
        empeoradas: totalEmpeoradas,
        estables: totalEstables,
        promedioMejora
      },
      impactos
    })

  } catch (error) {
    console.error('Error en API impact:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}