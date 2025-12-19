import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import DashboardNav from '@/components/DashboardNav'
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
              <p className="mt-2 text-gray-600">Historial de ventas ordenadas por fecha</p>
            </div>
            <Link
              href="/dashboard/sales/upload"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
            >
              📤 Subir Ticket
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Ventas</p>
                <p className="text-2xl font-bold text-green-600">€{totalSales.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{salesList.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio por Venta</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{salesList.length > 0 ? (totalSales / salesList.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de ventas agrupadas por fecha */}
          <div className="space-y-6">
            {sortedDates.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <span className="text-4xl block mb-2">🧾</span>
                <p className="text-gray-500">No hay ventas registradas</p>
                <Link
                  href="/dashboard/sales/upload"
                  className="mt-4 inline-block text-green-600 hover:text-green-700 font-medium"
                >
                  Subir primer ticket →
                </Link>
              </div>
            ) : (
              sortedDates.map((date) => {
                const dateSales = salesByDate[date]
                const dateTotal = dateSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
                const formattedDate = date !== 'sin-fecha'
                  ? new Date(date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Sin fecha'

                return (
                  <div key={date} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Cabecera de fecha */}
                    <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        📅 {formattedDate}
                      </h3>
                      <span className="text-green-600 font-semibold">
                        €{dateTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Ventas del día */}
                    <div className="divide-y">
                      {dateSales.map((sale: any) => (
                        <Link 
                          key={sale.id} 
                          href={`/dashboard/sales/${sale.id}`}
                          className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  sale.source === 'ticket' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sale.source === 'ticket' ? 'Ticket' : 'Manual'}
                                </span>
                                {sale.payment_method && sale.payment_method !== 'desconocido' && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                                    {sale.payment_method}
                                  </span>
                                )}
                              </div>
                              
                              <p className="font-medium text-gray-900 mt-2">
                                {sale.notes?.replace('Negocio: ', '') || 'Venta'}
                              </p>
                              
                              {sale.sale_items && sale.sale_items.length > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {sale.sale_items.length} item{sale.sale_items.length > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-gray-900">
                                €{sale.total?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}