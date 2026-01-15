// app/dashboard/sales/page.tsx
// CORREGIDO: 2026-01-10 - Usar subtotal como base imponible
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
import SalesListWithSelection from '@/components/SalesListWithSelection'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PAGE_SIZE = 50

export default async function SalesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Consulta 1: Obtener el total de ventas (COUNT)
  const { count: totalCount, error: countError } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // ⭐ CORRECCIÓN: Obtener subtotal (base imponible) en vez de total
  const { data: allSalesForSum, error: sumError } = await supabase
    .from('sales')
    .select('subtotal, total')
    .eq('user_id', userId)

  // ⭐ CORRECCIÓN: Usar subtotal como base imponible para contabilidad
  const totalAmount = allSalesForSum?.reduce((sum, sale) => {
    // Usar subtotal si existe, si no usar total (compatibilidad)
    const baseAmount = sale.subtotal || sale.total || 0
    return sum + baseAmount
  }, 0) || 0
  
  const totalSalesCount = totalCount || 0

  // Consulta 3: Obtener primera página de ventas (paginadas)
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (error) {
    console.error('Error fetching sales:', error)
  }

  const salesList: any[] = sales || []
  const hasMore = totalSalesCount > PAGE_SIZE

  // Agrupar ventas por fecha (solo las cargadas inicialmente)
  const salesByDate: { [key: string]: any[] } = {}
  salesList.forEach((sale) => {
    const date = sale.sale_date || sale.created_at?.split('T')[0] || 'sin-fecha'
    if (!salesByDate[date]) {
      salesByDate[date] = []
    }
    salesByDate[date].push(sale)
  })

  const sortedDates = Object.keys(salesByDate).sort((a, b) => {
    if (a === 'sin-fecha') return 1
    if (b === 'sin-fecha') return -1
    return new Date(b).getTime() - new Date(a).getTime()
  })

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-[#262626]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header responsive */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#d98c21]">Ventas</h1>
              <p className="text-[#FFFCFF] text-base sm:text-[20px] mt-1">Historial de ventas ordenadas por fecha</p>
            </div>
            <Link
              href="/dashboard/sales/upload"
              className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d] transition-colors w-full sm:w-auto text-center border border-[#404040]"
            >
              + Subir Ventas
            </Link>
          </div>

          {/* ========== RESUMEN REDISEÑADO (estilo coherente con Facturas) ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Tarjeta 1: Total Ventas */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-6 hover:border-[#d98c21] transition-colors">
              <p className="text-gray-400 text-sm mb-2">Total Ventas</p>
              <p className="text-4xl font-bold text-green-600">
                €{totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Base imponible (sin IVA)</p>
            </div>

            {/* Tarjeta 2: Número de Ventas */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-6 hover:border-[#d98c21] transition-colors">
              <p className="text-gray-400 text-sm mb-2">Número de Ventas</p>
              <p className="text-4xl font-bold text-[#FFFCFF]">
                {totalSalesCount}
              </p>
            </div>

            {/* Tarjeta 3: Promedio por Venta */}
            <div className="bg-[#1a1a1a] rounded-xl border border-[#404040] p-6 hover:border-[#d98c21] transition-colors">
              <p className="text-gray-400 text-sm mb-2">Promedio por Venta</p>
              <p className="text-4xl font-bold text-[#FFFCFF]">
                €{totalSalesCount > 0 
                  ? (totalAmount / totalSalesCount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'}
              </p>
            </div>
          </div>
          {/* ====================================================================== */}

          {/* Lista con selección y paginación */}
          <SalesListWithSelection
            initialSalesByDate={salesByDate}
            initialSortedDates={sortedDates}
            totalSales={totalSalesCount}
            initialLoadedCount={salesList.length}
            hasMore={hasMore}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>
    </>
  )
}