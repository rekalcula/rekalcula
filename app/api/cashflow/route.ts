import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener datos de cashflow
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || getDefaultStartDate()
    const endDate = searchParams.get('endDate') || getDefaultEndDate()
    const groupBy = searchParams.get('groupBy') || 'day'

    // 1. Obtener entradas (ventas)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        total,
        sale_date,
        payment_due_date,
        payment_status,
        actual_payment_date,
        customer_name,
        payment_methods (
          name,
          days
        )
      `)
      .eq('user_id', userId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: true })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
    }

    // 2. Obtener salidas (facturas) - usa total_amount y supplier
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        total_amount,
        invoice_date,
        payment_due_date,
        payment_status,
        actual_payment_date,
        supplier,
        category,
        payment_methods (
          name,
          days
        )
      `)
      .eq('user_id', userId)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .order('invoice_date', { ascending: true })

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
    }

    // 3. Obtener costos fijos
    const { data: fixedCostsData } = await supabase
      .from('fixed_costs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    const sales = salesData || []
    const invoices = invoicesData || []
    const fixedCosts = fixedCostsData || []

    // Calcular resumen
    const summary = calculateSummary(sales, invoices, fixedCosts, startDate, endDate, groupBy)

    // Próximos vencimientos (30 días)
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: upcomingInbound } = await supabase
      .from('sales')
      .select(`id, total, sale_date, payment_due_date, customer_name, payment_methods (name, days)`)
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .gte('payment_due_date', today)
      .lte('payment_due_date', thirtyDaysLater)
      .order('payment_due_date', { ascending: true })
      .limit(10)

    const { data: upcomingOutbound } = await supabase
      .from('invoices')
      .select(`id, total_amount, invoice_date, payment_due_date, supplier, category, payment_methods (name, days)`)
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .gte('payment_due_date', today)
      .lte('payment_due_date', thirtyDaysLater)
      .order('payment_due_date', { ascending: true })
      .limit(10)

    const { data: overdueInboundData } = await supabase
      .from('sales')
      .select('id, total')
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .lt('payment_due_date', today)

    const { data: overdueOutboundData } = await supabase
      .from('invoices')
      .select('id, total_amount')
      .eq('user_id', userId)
      .eq('payment_status', 'pending')
      .lt('payment_due_date', today)

    const transformedUpcomingOutbound = (upcomingOutbound || []).map(item => ({
      ...item,
      total: item.total_amount
    }))

    return NextResponse.json({
      success: true,
      cashflow: {
        ...summary,
        upcomingInbound: upcomingInbound || [],
        upcomingOutbound: transformedUpcomingOutbound,
        overdueInbound: (overdueInboundData || []).reduce((acc, s) => acc + (s.total || 0), 0),
        overdueOutbound: (overdueOutboundData || []).reduce((acc, i) => acc + (i.total_amount || 0), 0),
        overdueInboundCount: (overdueInboundData || []).length,
        overdueOutboundCount: (overdueOutboundData || []).length
      },
      period: { startDate, endDate, groupBy }
    })

  } catch (error) {
    console.error('Error in cashflow GET:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST - Marcar como pagado/cobrado
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, action, paymentDate } = body

    if (!type || !id || !action) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const table = type === 'invoice' ? 'invoices' : 'sales'
    const actualDate = paymentDate || new Date().toISOString().split('T')[0]

    if (action === 'mark_paid') {
      const { error } = await supabase
        .from(table)
        .update({
          payment_status: 'paid',
          actual_payment_date: actualDate
        })
        .eq('id', id)

      if (error) {
        console.error('Error marking as paid:', error)
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Marcado como pagado' })
    }

    if (action === 'mark_pending') {
      const { error } = await supabase
        .from(table)
        .update({
          payment_status: 'pending',
          actual_payment_date: null
        })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Marcado como pendiente' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error) {
    console.error('Error in cashflow POST:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 2)
  return date.toISOString().split('T')[0]
}

function calculateSummary(
  sales: any[],
  invoices: any[],
  fixedCosts: any[],
  startDate: string,
  endDate: string,
  groupBy: string
) {
  let inboundCompleted = 0
  let inboundPending = 0
  let outboundCompleted = 0
  let outboundPending = 0

  sales.forEach(sale => {
    const amount = sale.total || 0
    if (sale.payment_status === 'paid') {
      inboundCompleted += amount
    } else {
      inboundPending += amount
    }
  })

  invoices.forEach(invoice => {
    const amount = invoice.total_amount || 0
    if (invoice.payment_status === 'paid') {
      outboundCompleted += amount
    } else {
      outboundPending += amount
    }
  })

  const monthsInPeriod = getMonthsBetweenDates(startDate, endDate)
  const monthlyFixedCosts = fixedCosts.reduce((acc, cost) => acc + (cost.amount || 0), 0)
  const totalFixedCosts = monthlyFixedCosts * monthsInPeriod

  outboundPending += totalFixedCosts

  const totalInbound = inboundCompleted + inboundPending
  const totalOutbound = outboundCompleted + outboundPending
  const netCashflow = totalInbound - totalOutbound

  const byPeriod = groupByPeriod(sales, invoices, startDate, endDate, groupBy)

  return {
    totalInbound,
    totalOutbound,
    netCashflow,
    inboundCompleted,
    inboundPending,
    outboundCompleted,
    outboundPending,
    fixedCostsMonthly: monthlyFixedCosts,
    byPeriod
  }
}

function getMonthsBetweenDates(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth())
  return Math.max(1, months)
}

function groupByPeriod(sales: any[], invoices: any[], startDate: string, endDate: string, groupBy: string): any[] {
  const periods: { [key: string]: { inbound: number; outbound: number } } = {}

  const getPeriodKey = (dateStr: string): string => {
    const date = new Date(dateStr)
    if (groupBy === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else if (groupBy === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      return weekStart.toISOString().split('T')[0]
    }
    return dateStr
  }

  sales.forEach(sale => {
    const effectiveDate = sale.payment_status === 'paid' 
      ? (sale.actual_payment_date || sale.sale_date)
      : (sale.payment_due_date || sale.sale_date)
    
    if (effectiveDate) {
      const key = getPeriodKey(effectiveDate)
      if (!periods[key]) periods[key] = { inbound: 0, outbound: 0 }
      periods[key].inbound += sale.total || 0
    }
  })

  invoices.forEach(invoice => {
    const effectiveDate = invoice.payment_status === 'paid'
      ? (invoice.actual_payment_date || invoice.invoice_date)
      : (invoice.payment_due_date || invoice.invoice_date)
    
    if (effectiveDate) {
      const key = getPeriodKey(effectiveDate)
      if (!periods[key]) periods[key] = { inbound: 0, outbound: 0 }
      periods[key].outbound += invoice.total_amount || 0
    }
  })

  const sortedPeriods = Object.entries(periods)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      inbound: data.inbound,
      outbound: data.outbound,
      net: data.inbound - data.outbound
    }))

  let cumulative = 0
  return sortedPeriods.map(period => {
    cumulative += period.net
    return { ...period, cumulative }
  })
}