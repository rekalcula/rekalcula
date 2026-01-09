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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const compare = searchParams.get('compare') === 'true'

    // Calcular fechas segun el periodo
    const now = new Date()
    let startDate: Date
    let endDate: Date
    let prevStartDate: Date
    let prevEndDate: Date

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - 1)
      prevEndDate = new Date(startDate)
    } else if (period === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - 7)
      prevEndDate = new Date(startDate)
      prevEndDate.setDate(prevEndDate.getDate() - 1)
    } else {
      // Mes completo (del 1 al ultimo dia del mes)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
    }

    // Obtener ventas del periodo actual
    const { data: currentSales, error: currentError } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('user_id', userId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0])

    if (currentError) {
      console.error('Error fetching current sales:', currentError)
      return NextResponse.json({ error: currentError.message }, { status: 500 })
    }

    // Obtener ventas del periodo anterior si se solicita comparacion
    let previousSales: any[] = []
    if (compare) {
      const { data: prevData, error: prevError } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('user_id', userId)
        .gte('sale_date', prevStartDate.toISOString().split('T')[0])
        .lte('sale_date', prevEndDate.toISOString().split('T')[0])

      if (!prevError && prevData) {
        previousSales = prevData
      }
    }

    // Agregar datos por producto - periodo actual
    const productStats: { [key: string]: { quantity: number; revenue: number } } = {}
    let totalQuantity = 0
    let totalRevenue = 0

    for (const sale of currentSales || []) {
      // Sumar el total de la venta directamente
      totalRevenue += sale.total || 0
      
      for (const item of sale.sale_items || []) {
        const productName = item.product_name || 'Otros'
        const normalizedName = normalizeProductName(productName)
        
        if (!productStats[normalizedName]) {
          productStats[normalizedName] = { quantity: 0, revenue: 0 }
        }
        
        productStats[normalizedName].quantity += item.quantity || 1
        productStats[normalizedName].revenue += item.total || 0
        totalQuantity += item.quantity || 1
      }
    }

    // Agregar datos por producto - periodo anterior
    const prevProductStats: { [key: string]: { quantity: number; revenue: number } } = {}
    let prevTotalQuantity = 0
    let prevTotalRevenue = 0

    if (compare) {
      for (const sale of previousSales) {
        for (const item of sale.sale_items || []) {
          const productName = item.product_name || 'Otros'
          const normalizedName = normalizeProductName(productName)
          
          if (!prevProductStats[normalizedName]) {
            prevProductStats[normalizedName] = { quantity: 0, revenue: 0 }
          }
          
          prevProductStats[normalizedName].quantity += item.quantity || 1
          prevProductStats[normalizedName].revenue += item.total || 0
          prevTotalQuantity += item.quantity || 1
          prevTotalRevenue += item.total || 0
        }
      }
    }

    // Convertir a array y ordenar por cantidad
    const products = Object.entries(productStats)
      .map(([name, stats]) => {
        const prevStats = prevProductStats[name] || { quantity: 0, revenue: 0 }
        const quantityChange = prevStats.quantity > 0 
          ? ((stats.quantity - prevStats.quantity) / prevStats.quantity) * 100 
          : 0
        const revenueChange = prevStats.revenue > 0 
          ? ((stats.revenue - prevStats.revenue) / prevStats.revenue) * 100 
          : 0

        return {
          name: capitalizeFirst(name),
          quantity: stats.quantity,
          revenue: stats.revenue,
          percentage: totalQuantity > 0 ? (stats.quantity / totalQuantity) * 100 : 0,
          revenuePercentage: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
          prevQuantity: prevStats.quantity,
          prevRevenue: prevStats.revenue,
          quantityChange: Math.round(quantityChange * 10) / 10,
          revenueChange: Math.round(revenueChange * 10) / 10
        }
      })
      .sort((a, b) => b.quantity - a.quantity)

    // Calcular cambios totales
    const totalQuantityChange = prevTotalQuantity > 0 
      ? ((totalQuantity - prevTotalQuantity) / prevTotalQuantity) * 100 
      : 0
    const totalRevenueChange = prevTotalRevenue > 0 
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
      : 0

    return NextResponse.json({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalQuantity,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalSales: currentSales?.length || 0,
      topProduct: products[0] || null,
      products,
      comparison: compare ? {
        prevStartDate: prevStartDate.toISOString().split('T')[0],
        prevEndDate: prevEndDate.toISOString().split('T')[0],
        prevTotalQuantity,
        prevTotalRevenue: Math.round(prevTotalRevenue * 100) / 100,
        prevTotalSales: previousSales.length,
        quantityChange: Math.round(totalQuantityChange * 10) / 10,
        revenueChange: Math.round(totalRevenueChange * 10) / 10
      } : null
    })

  } catch (error) {
    console.error('Error en analytics:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Normalizar nombres de productos - VERSION GENERICA
// Solo limpia el texto sin asumir tipo de negocio
function normalizeProductName(name: string): string {
  if (!name) return 'otros'
  
  let normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .trim()
  
  if (!normalized || normalized.length === 0) {
    return 'otros'
  }
  
  return normalized
}

function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}