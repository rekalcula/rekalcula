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

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // ========================================
  // 1. OBTENER VENTAS
  // ========================================
  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  // ========================================
  // 2. OBTENER COSTES FIJOS
  // ========================================
  const { data: fixedCosts } = await supabase
    .from('fixed_costs')
    .select('*, fixed_cost_categories(*)')
    .eq('user_id', userId)

  // CORREGIDO: Filtrar en JavaScript para mayor flexibilidad
  const activeFixedCosts = (fixedCosts || []).filter(cost => {
    if (cost.is_active === false || cost.is_active === 'false') return false
    if (cost.active === false || cost.active === 'false') return false
    return true
  })

  // ========================================
  // 3. OBTENER FACTURAS DE COMPRA (COSTES VARIABLES)
  // ========================================
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .gte('invoice_date', startOfMonth)
    .lte('invoice_date', endOfMonth)

  // ========================================
  // 4. CALCULAR TOTALES
  // ========================================
  const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)
  
  // CORREGIDO: Costes variables = Facturas de compra (materia prima, productos, etc.)
  const totalVariableCosts = (invoices || []).reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

  let rentCosts = 0
  let laborCosts = 0
  let otherFixedCosts = 0

  const totalFixedCosts = activeFixedCosts.reduce((sum, cost) => {
    let monthly = cost.amount || 0
    if (cost.frequency === 'quarterly') monthly = monthly / 3
    if (cost.frequency === 'yearly' || cost.frequency === 'annual') monthly = monthly / 12

    const categoryName = cost.fixed_cost_categories?.name?.toLowerCase() || cost.category?.toLowerCase() || ''
    
    if (categoryName.includes('alquiler') || categoryName.includes('hipoteca') || categoryName.includes('local')) {
      rentCosts += monthly
    } else if (categoryName.includes('personal') || categoryName.includes('salario') || categoryName.includes('nomina') || categoryName.includes('laboral')) {
      laborCosts += monthly
    } else {
      otherFixedCosts += monthly
    }

    return sum + monthly
  }, 0)

  // ========================================
  // 5. CALCULAR METRICAS FINANCIERAS
  // ========================================
  const grossProfit = totalSales - totalVariableCosts
  const netProfit = grossProfit - totalFixedCosts
  
  const contributionMargin = totalSales > 0
    ? grossProfit / totalSales
    : 0

  const breakEvenPoint = contributionMargin > 0
    ? totalFixedCosts / contributionMargin
    : 0

  const financialData = {
    totalSales,
    totalVariableCosts,
    totalFixedCosts,
    grossProfit,
    netProfit,
    contributionMargin: contributionMargin * 100,
    breakEvenPoint,
    salesAboveBreakEven: totalSales - breakEvenPoint
  }

  const alertsData = {
    totalSales,
    totalVariableCosts,
    totalFixedCosts,
    rentCosts,
    laborCosts,
    grossProfit,
    netProfit
  }

  const periodo = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* ========================================
              HEADER - Movil: vertical / Desktop: horizontal
              ======================================== */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Analisis Financiero</h1>
              <p className="mt-2 text-[#FFFCFF] text-[20px]">Punto de equilibrio y rentabilidad - {periodo}</p>
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