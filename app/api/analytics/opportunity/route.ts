import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Nombres de días en español
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Análisis hora por hora (24 horas)
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => i)

interface SaleWithTime {
  id: number
  subtotal: number
  total: number
  sale_date: string
  created_at: string
  payment_method?: string
}

interface OpportunityRecommendation {
  type: 'ampliar_horario' | 'reducir_horario' | 'redistribuir_recursos' | 'ajuste_estacional'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impactoMensual: number
  confidence: number // 0-100
  data: any
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración de costos fijos del usuario
    const { data: fixedCosts } = await supabase
      .from('fixed_costs')
      .select('amount, frequency, is_active')
      .eq('user_id', userId)

    const activeCosts = (fixedCosts || []).filter(c => c.is_active !== false && c.is_active !== 'false')
    
    // Calcular costos fijos mensuales
    const costosFijosMensuales = activeCosts.reduce((sum, cost) => {
      let monthly = cost.amount || 0
      if (cost.frequency === 'quarterly') monthly = monthly / 3
      if (cost.frequency === 'yearly' || cost.frequency === 'annual') monthly = monthly / 12
      return sum + monthly
    }, 0)

    // Obtener ventas de los últimos 3 meses para análisis temporal
    const now = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(now.getMonth() - 3)

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, subtotal, total, sale_date, created_at, payment_method')
      .eq('user_id', userId)
      .gte('sale_date', threeMonthsAgo.toISOString().split('T')[0])
      .lte('sale_date', now.toISOString().split('T')[0])

    if (salesError || !sales || sales.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'No hay suficientes datos para análisis temporal'
      })
    }

    // ========================================
    // ANÁLISIS POR DÍA DE LA SEMANA
    // ========================================
    const ventasPorDia: { [key: number]: { ventas: number; ingresos: number; count: number } } = {}
    
    for (let i = 0; i < 7; i++) {
      ventasPorDia[i] = { ventas: 0, ingresos: 0, count: 0 }
    }

    sales.forEach((sale: SaleWithTime) => {
      const fecha = new Date(sale.sale_date)
      const diaSemana = fecha.getDay()
      const ingreso = sale.subtotal || sale.total || 0
      
      ventasPorDia[diaSemana].ventas += 1
      ventasPorDia[diaSemana].ingresos += ingreso
      ventasPorDia[diaSemana].count += 1
    })

    // Calcular promedios por día
    const diasAnalisis = Object.entries(ventasPorDia).map(([dia, data]) => {
      // Contar cuántos días de este tipo hay en el periodo
      const diasEnPeriodo = contarDiasEnPeriodo(parseInt(dia), threeMonthsAgo, now)
      
      return {
        dia: parseInt(dia),
        nombre: DIAS_SEMANA[parseInt(dia)],
        ventasPromedio: diasEnPeriodo > 0 ? data.ventas / diasEnPeriodo : 0,
        ingresosPromedio: diasEnPeriodo > 0 ? data.ingresos / diasEnPeriodo : 0,
        totalVentas: data.ventas,
        totalIngresos: data.ingresos,
        diasContados: diasEnPeriodo
      }
    })

    // ========================================
    // ANÁLISIS HORA POR HORA (24 HORAS)
    // ========================================
    const ventasPorHora: { [key: number]: { ventas: number; ingresos: number } } = {}
    
    // Inicializar todas las horas (0-23)
    for (let h = 0; h < 24; h++) {
      ventasPorHora[h] = { ventas: 0, ingresos: 0 }
    }

    sales.forEach((sale: SaleWithTime) => {
      // Usar created_at para hora exacta de venta
      const fecha = new Date(sale.created_at || sale.sale_date)
      const hora = fecha.getHours()
      const ingreso = sale.subtotal || sale.total || 0
      
      if (hora >= 0 && hora < 24) {
        ventasPorHora[hora].ventas += 1
        ventasPorHora[hora].ingresos += ingreso
      }
    })

    // Calcular métricas por hora
    const totalDias = Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))
    
    const horariosAnalisis = Object.entries(ventasPorHora).map(([hora, data]) => ({
      hora: parseInt(hora),
      horaFormato: `${hora.padStart(2, '0')}:00`,
      ventasPromedioDiarias: totalDias > 0 ? data.ventas / totalDias : 0,
      ingresosPromedioDiarios: totalDias > 0 ? data.ingresos / totalDias : 0,
      totalVentas: data.ventas,
      totalIngresos: data.ingresos
    })).sort((a, b) => a.hora - b.hora)

    // ========================================
    // GENERAR RECOMENDACIONES DE OPORTUNIDAD
    // ========================================
    const recomendaciones: OpportunityRecommendation[] = []

    // 1. ANÁLISIS DE DÍAS CON BAJA ACTIVIDAD
    const ingresoPromedioDiario = sales.reduce((sum, s) => sum + (s.subtotal || s.total || 0), 0) / totalDias
    const costoFijoDiario = costosFijosMensuales / 30

    diasAnalisis.forEach(dia => {
      if (dia.ingresosPromedio < costoFijoDiario * 0.5 && dia.ventasPromedio < 2) {
        // Día con muy poca actividad
        const ahorroPotencial = (costoFijoDiario * 0.3) * 4.33 // Mensual (4.33 semanas/mes)
        
        recomendaciones.push({
          type: 'reducir_horario',
          priority: ahorroPotencial > costosFijosMensuales * 0.05 ? 'high' : 'medium',
          title: `Bajo rendimiento los ${dia.nombre}`,
          description: `Los ${dia.nombre} generas solo €${Math.round(dia.ingresosPromedio)} de media, muy por debajo del costo operativo diario (€${Math.round(costoFijoDiario)}). Reducir horario o cerrar este día podría optimizar recursos.`,
          impactoMensual: Math.round(ahorroPotencial),
          confidence: dia.diasContados >= 8 ? 85 : 60,
          data: {
            dia: dia.nombre,
            ingresosActuales: Math.round(dia.ingresosPromedio),
            ventasPromedio: Math.round(dia.ventasPromedio * 10) / 10,
            costoOperativoDiario: Math.round(costoFijoDiario)
          }
        })
      }
    })

    // 2. ANÁLISIS DE DÍAS CON ALTA ACTIVIDAD
    const mejorDia = diasAnalisis.reduce((max, dia) => 
      dia.ingresosPromedio > max.ingresosPromedio ? dia : max
    , diasAnalisis[0])

    if (mejorDia.ingresosPromedio > ingresoPromedioDiario * 1.5) {
      recomendaciones.push({
        type: 'ampliar_horario',
        priority: 'medium',
        title: `Oportunidad en ${mejorDia.nombre}`,
        description: `Los ${mejorDia.nombre} son tu mejor día (€${Math.round(mejorDia.ingresosPromedio)} de media). Ampliar horario este día podría capturar más demanda.`,
        impactoMensual: Math.round(mejorDia.ingresosPromedio * 0.2 * 4.33),
        confidence: 70,
        data: {
          dia: mejorDia.nombre,
          ingresosActuales: Math.round(mejorDia.ingresosPromedio),
          ventasPromedio: Math.round(mejorDia.ventasPromedio * 10) / 10,
          potencialAdicional: Math.round(mejorDia.ingresosPromedio * 0.2)
        }
      })
    }

    // 3. ANÁLISIS DE HORAS ESPECÍFICAS
    const mejorHora = horariosAnalisis.reduce((max, h) => 
      h.ingresosPromedioDiarios > max.ingresosPromedioDiarios ? h : max
    , horariosAnalisis[0])

    const peorHoraConVentas = horariosAnalisis
      .filter(h => h.ventasPromedioDiarias > 0)
      .reduce((min, h) => 
        h.ingresosPromedioDiarios < min.ingresosPromedioDiarios ? h : min
      , horariosAnalisis.find(h => h.ventasPromedioDiarias > 0) || horariosAnalisis[0])

    // Identificar franjas de actividad (horas consecutivas con ventas)
    const horasConActividad = horariosAnalisis.filter(h => h.totalVentas > 0)
    const horaApertura = horasConActividad.length > 0 ? horasConActividad[0].hora : 8
    const horaCierre = horasConActividad.length > 0 ? horasConActividad[horasConActividad.length - 1].hora : 22

    if (mejorHora.ingresosPromedioDiarios > ingresoPromedioDiario / 24 * 3) {
      recomendaciones.push({
        type: 'ampliar_horario',
        priority: 'high',
        title: `Pico de demanda: ${mejorHora.horaFormato}`,
        description: `A las ${mejorHora.horaFormato} concentras tu mayor actividad con €${Math.round(mejorHora.ingresosPromedioDiarios)}/día. Asegurar capacidad suficiente en esta hora es crítico.`,
        impactoMensual: Math.round(mejorHora.ingresosPromedioDiarios * 0.15 * 30),
        confidence: 75,
        data: {
          hora: mejorHora.horaFormato,
          ingresosPromedioHora: Math.round(mejorHora.ingresosPromedioDiarios),
          ventasPromedioHora: Math.round(mejorHora.ventasPromedioDiarias * 10) / 10
        }
      })
    }

    // Analizar horas con muy baja actividad consecutivas al inicio o final del día
    const horasInicio = horariosAnalisis.slice(horaApertura, horaApertura + 3)
    const ingresosMedioInicio = horasInicio.reduce((sum, h) => sum + h.ingresosPromedioDiarios, 0) / 3

    if (ingresosMedioInicio < costoFijoDiario * 0.1 && horaApertura < 10) {
      recomendaciones.push({
        type: 'reducir_horario',
        priority: 'medium',
        title: `Baja actividad al abrir (${horaApertura}:00-${horaApertura + 3}:00)`,
        description: `Las primeras horas apenas generan €${Math.round(ingresosMedioInicio)}/día. Abrir 2-3 horas más tarde podría reducir costos operativos sin impacto significativo.`,
        impactoMensual: Math.round(costoFijoDiario * 0.15 * 30),
        confidence: 70,
        data: {
          horaActual: `${horaApertura}:00`,
          ingresosPromedio: Math.round(ingresosMedioInicio),
          horaSugerida: `${horaApertura + 2}:00`
        }
      })
    }

    // 4. ANÁLISIS DE CONCENTRACIÓN DE VENTAS
    const ventasFinDeSemana = (ventasPorDia[5].ingresos + ventasPorDia[6].ingresos + ventasPorDia[0].ingresos)
    const ventasSemanales = Object.values(ventasPorDia).reduce((sum, d) => sum + d.ingresos, 0)
    const porcentajeFinDeSemana = (ventasFinDeSemana / ventasSemanales) * 100

    if (porcentajeFinDeSemana > 60) {
      recomendaciones.push({
        type: 'redistribuir_recursos',
        priority: 'medium',
        title: 'Alta concentración en fin de semana',
        description: `El ${Math.round(porcentajeFinDeSemana)}% de tus ventas ocurren en fin de semana. Optimizar stock y personal para estos días podría mejorar márgenes.`,
        impactoMensual: Math.round((ventasFinDeSemana / 13) * 0.05), // 5% mejora en margen
        confidence: 80,
        data: {
          porcentajeFinDeSemana: Math.round(porcentajeFinDeSemana),
          ventasFinDeSemana: Math.round(ventasFinDeSemana),
          ventasTotales: Math.round(ventasSemanales)
        }
      })
    }

    // Ordenar por impacto e prioridad
    recomendaciones.sort((a, b) => {
      const prioridadPeso = { high: 3, medium: 2, low: 1 }
      return (prioridadPeso[b.priority] * b.impactoMensual) - (prioridadPeso[a.priority] * a.impactoMensual)
    })

    return NextResponse.json({
      hasData: true,
      periodoAnalisis: {
        inicio: threeMonthsAgo.toISOString().split('T')[0],
        fin: now.toISOString().split('T')[0],
        totalDias,
        totalVentas: sales.length
      },
      analisisDias: diasAnalisis,
      analisisHorarios: horariosAnalisis,
      recomendaciones: recomendaciones.slice(0, 5), // Top 5
      metricas: {
        ingresoPromedioDiario: Math.round(ingresoPromedioDiario),
        costoFijoDiario: Math.round(costoFijoDiario),
        mejorDia: mejorDia.nombre,
        mejorHora: mejorHora.horaFormato,
        impactoTotalPotencial: Math.round(recomendaciones.reduce((sum, r) => sum + r.impactoMensual, 0))
      }
    })

  } catch (error) {
    console.error('Error en análisis de oportunidades:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Función auxiliar para contar días específicos en un periodo
function contarDiasEnPeriodo(diaSemana: number, inicio: Date, fin: Date): number {
  let count = 0
  const current = new Date(inicio)
  
  while (current <= fin) {
    if (current.getDay() === diaSemana) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}