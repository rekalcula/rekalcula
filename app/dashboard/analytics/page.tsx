import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import BreakEvenChart from '@/components/BreakEvenChart'
import FinancialSummary from '@/components/FinancialSummary'
import ProfitabilityAnalysis from '@/components/ProfitabilityAnalysis'
import FinancialAlertsPanel from '@/components/FinancialAlertsPanel'
import FinancialExportButton from './FinancialExportButton'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // ========================================
  // DETECTAR RANGO DE DATOS AUTOMÁTICAMENTE
  // ========================================
  
  // Obtener la fecha más antigua de ventas
  const { data: oldestSale } = await supabase
    .from('sales')
    .select('sale_date')
    .eq('user_id', userId)
    .order('sale_date', { ascending: true })
    .limit(1)
    .single()

  // Obtener la fecha más antigua de facturas
  const { data: oldestInvoice } = await supabase
    .from('invoices')
    .select('invoice_date')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: true })
    .limit(1)
    .single()

  const now = new Date()
  const endOfPeriod = now.toISOString().split('T')[0]
  
  // Determinar la fecha de inicio (la más antigua entre ventas y facturas)
  let startOfPeriod: string
  
  if (oldestSale?.sale_date && oldestInvoice?.invoice_date) {
    startOfPeriod = oldestSale.sale_date < oldestInvoice.invoice_date 
      ? oldestSale.sale_date 
      : oldestInvoice.invoice_date
  } else if (oldestSale?.sale_date) {
    startOfPeriod = oldestSale.sale_date
  } else if (oldestInvoice?.invoice_date) {
    startOfPeriod = oldestInvoice.invoice_date
  } else {
    // Si no hay datos, usar el mes actual
    startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }

  // Calcular número de meses en el período
  const startDate = new Date(startOfPeriod)
  const endDate = new Date(endOfPeriod)
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth()) + 
                     (endDate.getDate() / 30) // Fracción del mes actual
  const monthsInPeriod = Math.max(1, monthsDiff)

  // ========================================
  // 1. OBTENER VENTAS (TODO EL PERÍODO)
  // ========================================
  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .gte('sale_date', startOfPeriod)
    .lte('sale_date', endOfPeriod)

  // ========================================
  // 2. OBTENER COSTES FIJOS
  // ========================================
  const { data: fixedCosts } = await supabase
    .from('fixed_costs')
    .select('*, fixed_cost_categories(*)')
    .eq('user_id', userId)

  // Filtrar costes activos
  const activeFixedCosts = (fixedCosts || []).filter(cost => {
    if (cost.is_active === false || cost.is_active === 'false') return false
    if (cost.active === false || cost.active === 'false') return false
    return true
  })

  // ========================================
  // 3. OBTENER FACTURAS DE COMPRA (TODO EL PERÍODO)
  // ========================================
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .gte('invoice_date', startOfPeriod)
    .lte('invoice_date', endOfPeriod)

  // ========================================
  // 4. CALCULAR TOTALES
  // ========================================
  const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)
  
  // Costes variables = Facturas de compra
  const totalVariableCosts = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

  let rentCosts = 0
  let laborCosts = 0
  let otherFixedCosts = 0

  // Calcular costes fijos MENSUALES
  const monthlyFixedCosts = activeFixedCosts.reduce((sum, cost) => {
    let monthly = cost.amount || 0
    if (cost.frequency === 'quarterly') monthly = monthly / 3
    if (cost.frequency === 'yearly' || cost.frequency === 'annual') monthly = monthly / 12

    const categoryName = cost.fixed_cost_categories?.name?.toLowerCase() || cost.category?.toLowerCase() || ''
    
    if (categoryName.includes('alquiler') || categoryName.includes('hipoteca') || categoryName.includes('local') || categoryName.includes('inmobiliario')) {
      rentCosts += monthly
    } else if (categoryName.includes('personal') || categoryName.includes('salario') || categoryName.includes('nomina') || categoryName.includes('laboral') || categoryName.includes('nómina')) {
      laborCosts += monthly
    } else {
      otherFixedCosts += monthly
    }

    return sum + monthly
  }, 0)

  // IMPORTANTE: Multiplicar costes fijos por el número de meses del período
  const totalFixedCosts = monthlyFixedCosts * monthsInPeriod
  
  // También ajustar las categorías al período
  rentCosts = rentCosts * monthsInPeriod
  laborCosts = laborCosts * monthsInPeriod
  otherFixedCosts = otherFixedCosts * monthsInPeriod

  // ========================================
  // 5. CALCULAR MÉTRICAS FINANCIERAS
  // ========================================
  const grossProfit = totalSales - totalVariableCosts
  const netProfit = grossProfit - totalFixedCosts
  
  const contributionMargin = totalSales > 0
    ? grossProfit / totalSales
    : 0

  // Punto de equilibrio mensual
  const breakEvenPoint = contributionMargin > 0
    ? monthlyFixedCosts / contributionMargin
    : 0

  // Ventas mensuales promedio
  const monthlySalesAverage = totalSales / monthsInPeriod

  const financialData = {
    totalSales,
    totalVariableCosts,
    totalFixedCosts,
    grossProfit,
    netProfit,
    contributionMargin: contributionMargin * 100,
    breakEvenPoint,
    salesAboveBreakEven: monthlySalesAverage - breakEvenPoint,
    monthsInPeriod: Math.round(monthsInPeriod * 10) / 10,
    monthlyFixedCosts,
    monthlySalesAverage
  }

  const alertsData = {
    totalSales,
    totalVariableCosts,
    totalFixedCosts,
    rentCosts,
    laborCosts,
    grossProfit,
    netProfit,
    monthsInPeriod
  }

  // Formatear período para mostrar
  const startDateFormatted = startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const endDateFormatted = endDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const periodo = startDateFormatted === endDateFormatted 
    ? startDateFormatted 
    : `${startDateFormatted} - ${endDateFormatted}`

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Analisis Financiero</h1>
              <p className="mt-2 text-[#FFFCFF] text-[20px]">
                Punto de equilibrio y rentabilidad - {periodo}
              </p>
              <p className="mt-1 text-gray-400 text-sm">
                Período analizado: {Math.round(monthsInPeriod * 10) / 10} meses
              </p>
            </div>
            <FinancialExportButton data={financialData} periodo={periodo} />
          </div>

          <FinancialSummary data={financialData} />

          <div className="mt-8">
            <FinancialAlertsPanel data={alertsData} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <BreakEvenChart data={financialData} />
            <ProfitabilityAnalysis data={financialData} />
          </div>
        </div>
      </div>
    </>
  )
}