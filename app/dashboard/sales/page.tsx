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

export default async function SalesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener ventas ordenadas por fecha
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching sales:', error)
  }

  const salesList: any[] = sales || []
  const totalSales = salesList.reduce((sum, sale) => sum + (sale.total || 0), 0)

  // Agrupar ventas por fecha
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#d98c21]">Ventas</h1>
              <p className="text-[#FFFCFF] text-[20px]">Historial de ventas ordenadas por fecha</p>
            </div>
            <Link
              href="/dashboard/sales/upload"
              className="bg-[#0d0d0d] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d2d2d]"
            >
              + Subir Ventas
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-gray-200 rounded-xl shadow-sm p-6 border-2 border-[#979797] mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-xl text-gray-500">Total Ventas</p>
                <p className="text-2xl font-bold text-green-600">€{totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500">Número de Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{salesList.length}</p>
              </div>
              <div>
                <p className="text-xl text-gray-500">Promedio por Venta</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{salesList.length > 0 ? (totalSales / salesList.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista con selecciÃ³n */}
          <SalesListWithSelection
            salesByDate={salesByDate}
            sortedDates={sortedDates}
          />
        </div>
      </div>
    </>
  )
}
