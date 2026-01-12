import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Nombres de días en español
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface SaleWithTime {
  id: number
  subtotal: number
  total: number
  sale_date: string
  sale_time?: string  // Hora separada si existe
  created_at: string
  payment_method?: string
}

interface OpportunityRecommendation {
  type: 'ampliar_horario' | 'reducir_horario' | 'redistribuir_recursos' | 'ajuste_estacional'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impactoMensual: number
  confidence: number
  data: any
}

// ========================================
// NUEVA FUNCIÓN: Obtener horarios comerciales
// ========================================
async function getBusinessHours(userId: string) {
  try {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error al cargar business_hours:', error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.error('Error en getBusinessHours:', err)
    return []
  }
}

// Función para extraer hora de venta correctamente
function getHoraVenta(sale: SaleWithTime): number {
  // Opción 1: Si existe sale_time separado
  if (sale.sale_time) {
    const [hora] = sale.sale_time.split(':')
    return parseInt(hora)
  }
  
  // Opción 2: Extraer de sale_date (puede tener timestamp completo)
  const saleDate = new Date(sale.sale_date)
  if (!isNaN(saleDate.getTime()) && saleDate.getHours() > 0) {
    return saleDate.getHours()
  }
  
  // Opción 3: Usar created_at como último recurso
  const createdDate = new Date(sale.created_at)
  return createdDate.getHours()
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const selectedDay = searchParams.get('day') // 0-6 (domingo a sábado) o null para todos

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

    // Obtener ventas de los últimos 3 meses
    const now = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(now.getMonth() - 3)

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, subtotal, total, sale_date, sale_time, created_at, payment_method')
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
    // FILTRAR POR DÍA SI SE ESPECIFICÓ
    // ========================================
    let filteredSales = sales
    if (selectedDay !== null) {
      const dayNum = parseInt(selectedDay)
      filteredSales = sales.filter(sale => {
        const fecha = new Date(sale.sale_date)
        return fecha.getDay() === dayNum
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
    // ANÁLISIS HORA POR HORA (24 HORAS) - CON FILTRO POR DÍA
    // ========================================
    const ventasPorHora: { [key: number]: { ventas: number; ingresos: number } } = {}
    
    // Inicializar todas las horas (0-23)
    for (let h = 0; h < 24; h++) {
      ventasPorHora[h] = { ventas: 0, ingresos: 0 }
    }

    // Usar las ventas filtradas si hay filtro de día
    filteredSales.forEach((sale: SaleWithTime) => {
      const hora = getHoraVenta(sale)
      const ingreso = sale.subtotal || sale.total || 0
      
      if (hora >= 0 && hora < 24) {
        ventasPorHora[hora].ventas += 1
        ventasPorHora[hora].ingresos += ingreso
      }
    })

    // Calcular métricas por hora
    const totalDias = selectedDay !== null 
      ? contarDiasEnPeriodo(parseInt(selectedDay), threeMonthsAgo, now)
      : Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24))
    
    const horariosAnalisis = Object.entries(ventasPorHora).map(([hora, data]) => {
      const horaNum = parseInt(hora)
      return {
        hora: horaNum,
        horaFormato: `${horaNum.toString().padStart(2, '0')}:00`,
        ventasPromedioDiarias: totalDias > 0 ? data.ventas / totalDias : 0,
        ingresosPromedioDiarios: totalDias > 0 ? data.ingresos / totalDias : 0,
        totalVentas: data.ventas,
        totalIngresos: data.ingresos
      }
    }).sort((a, b) => a.hora - b.hora)

    // ========================================
    // GENERAR RECOMENDACIONES (solo si no hay filtro)
    // ========================================
    const recomendaciones: OpportunityRecommendation[] = []
    
    if (selectedDay === null) {
      const ingresoPromedioDiario = sales.reduce((sum, s) => sum + (s.subtotal || s.total || 0), 0) / totalDias
      const costoFijoDiario = costosFijosMensuales / 30

      // 1. ANÁLISIS DE DÍAS CON BAJA ACTIVIDAD
      diasAnalisis.forEach(dia => {
        if (dia.ingresosPromedio < costoFijoDiario * 0.5 && dia.ventasPromedio < 2) {
          const ahorroPotencial = (costoFijoDiario * 0.3) * 4.33
          
          recomendaciones.push({
            type: 'reducir_horario',
            priority: ahorroPotencial > costosFijosMensuales * 0.05 ? 'high' : 'medium',
            title: `Bajo rendimiento los ${dia.nombre}`,
            description: `Los ${dia.nombre} generas solo €${Math.round(dia.ingresosPromedio)} de media, muy por debajo del costo operativo diario (€${Math.round(costoFijoDiario)}). Reducir horario o cerrar este día podría optimizar recursos.`,
            impactoMensual: Math.round(ahorroPotencial),
            confidence: dia.diasContados >= 8 ? 85 : 60,
            data: {
              dia: dia.dia, // ← CAMBIO: Guardamos el número del día (0-6)
              diaNombre: dia.nombre,
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
            dia: mejorDia.dia, // ← CAMBIO: Guardamos el número del día (0-6)
            diaNombre: mejorDia.nombre,
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

      // Ordenar por impacto y prioridad
      recomendaciones.sort((a, b) => {
        const prioridadPeso = { high: 3, medium: 2, low: 1 }
        return (prioridadPeso[b.priority] * b.impactoMensual) - (prioridadPeso[a.priority] * a.impactoMensual)
      })
    }

    // ========================================
    // NUEVO: FILTRAR RECOMENDACIONES DE DÍAS CERRADOS
    // ========================================
    let recomendacionesFiltradas = recomendaciones
    
    if (selectedDay === null && recomendaciones.length > 0) {
      // Cargar configuración de horarios
      const businessHours = await getBusinessHours(userId)
      
      // Crear Set con días cerrados (mapeo: 0=Lunes en business_hours, 0=Domingo en Date.getDay())
      // IMPORTANTE: business_hours usa 0=Lunes, pero Date.getDay() usa 0=Domingo
      // Necesitamos convertir entre sistemas
      const closedDaysInDateSystem = new Set<number>()
      
      businessHours.forEach(h => {
        if (h.is_closed === true) {
          // Convertir de business_hours (0=Lunes) a Date.getDay() (0=Domingo)
          // business_hours: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
          // Date.getDay(): 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
          const dateSystemDay = h.day_of_week === 6 ? 0 : h.day_of_week + 1
          closedDaysInDateSystem.add(dateSystemDay)
        }
      })
      
      if (closedDaysInDateSystem.size > 0) {
        console.log('Días cerrados (sistema Date):', Array.from(closedDaysInDateSystem))
        
        // Filtrar recomendaciones de días que ya están cerrados
        recomendacionesFiltradas = recomendaciones.filter(rec => {
          // Si la recomendación es sobre un día específico
          if (rec.data && typeof rec.data.dia === 'number') {
            const diaRecomendacion = rec.data.dia
            
            // Si el día ya está cerrado, NO mostrar la recomendación
            if (closedDaysInDateSystem.has(diaRecomendacion)) {
              console.log(`⚠️ Filtrada recomendación redundante: "${rec.title}" (día ${diaRecomendacion} ya cerrado)`)
              return false
            }
          }
          
          return true
        })
        
        console.log(`Recomendaciones: ${recomendaciones.length} → ${recomendacionesFiltradas.length} (después de filtrar)`)
      }
    }

    return NextResponse.json({
      hasData: true,
      selectedDay: selectedDay !== null ? parseInt(selectedDay) : null,
      periodoAnalisis: {
        inicio: threeMonthsAgo.toISOString().split('T')[0],
        fin: now.toISOString().split('T')[0],
        totalDias,
        totalVentas: filteredSales.length
      },
      analisisDias: diasAnalisis,
      analisisHorarios: horariosAnalisis,
      recomendaciones: selectedDay === null ? recomendacionesFiltradas.slice(0, 5) : [], // ← CAMBIO: usar filtradas
      metricas: selectedDay === null ? {
        ingresoPromedioDiario: Math.round(sales.reduce((sum, s) => sum + (s.subtotal || s.total || 0), 0) / totalDias),
        costoFijoDiario: Math.round(costosFijosMensuales / 30),
        mejorDia: diasAnalisis.reduce((max, dia) => dia.ingresosPromedio > max.ingresosPromedio ? dia : max, diasAnalisis[0]).nombre,
        mejorHora: horariosAnalisis.reduce((max, h) => h.ingresosPromedioDiarios > max.ingresosPromedioDiarios ? h : max, horariosAnalisis[0]).horaFormato,
        impactoTotalPotencial: Math.round(recomendacionesFiltradas.reduce((sum, r) => sum + r.impactoMensual, 0)) // ← CAMBIO: usar filtradas
      } : null
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