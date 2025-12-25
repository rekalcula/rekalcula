import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import BreakEvenChart from '@/components/BreakEvenChart'
import FinancialSummary from '@/components/FinancialSummary'
import ProfitabilityAnalysis from '@/components/ProfitabilityAnalysis'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener datos del mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Obtener ventas del mes
  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .gte('sale_date', startOfMonth)
    .lte('sale_date', endOfMonth)

  // Obtener costos fijos
  const { data: fixedCosts } = await supabase
    .from('fixed_costs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Calcular totales
  const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)
  
  const totalVariableCosts = (sales || []).reduce((sum, sale) => {
    return sum + (sale.sale_items || []).reduce((itemSum: number, item: any) => 
      itemSum + ((item.cost_price || 0) * (item.quantity || 0)), 0)
  }, 0)

  const totalFixedCosts = (fixedCosts || []).reduce((sum, cost) => {
    let monthly = cost.amount
    if (cost.frequency === 'quarterly') monthly = cost.amount / 3
    if (cost.frequency === 'yearly') monthly = cost.amount / 12
    return sum + monthly
  }, 0)

  // Calcular punto de equilibrio
  const contributionMargin = totalSales > 0 
    ? (totalSales - totalVariableCosts) / totalSales 
    : 0
  const breakEvenPoint = contributionMargin > 0 
    ? totalFixedCosts / contributionMargin 
    : 0

  const financialData = {
    totalSales,
    totalVariableCosts,
    totalFixedCosts,
    grossProfit: totalSales - totalVariableCosts,
    netProfit: totalSales - totalVariableCosts - totalFixedCosts,
    contributionMargin: contributionMargin * 100,
    breakEvenPoint,
    salesAboveBreakEven: totalSales - breakEvenPoint
  }

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#d98c21]">Análisis Financiero
            </h1>
            <p className="mt-2 text-[#FFFCFF]">Punto de equilibrio y rentabilidad - {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <FinancialSummary data={financialData} />
          
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <BreakEvenChart data={financialData} />
            <ProfitabilityAnalysis data={financialData} />
          </div>
        </div>
      </div>
    </>
  )
}