import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import Link from 'next/link'

export default async function SalesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener ventas ordenadas por fecha
  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .order('sale_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)

  // Agrupar ventas por fecha
  const salesByDate = (sales || []).reduce((acc, sale) => {
    const date = sale.sale_date || 'sin-fecha'
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(sale)
    return acc
  }, {} as Record<string, typeof sales>)

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
                <p className="text-2xl font-bold text-gray-900">{sales?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio por Venta</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{sales && sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de ventas agrupadas por fecha */}
          <div className="space-y-6">
            {Object.keys(salesByDate).length === 0 ? (
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
              Object.entries(salesByDate).map(([date, dateSales]) => {
                const dateTotal = (dateSales || []).reduce((sum, s) => sum + (s.total || 0), 0)
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
                      {(dateSales || []).map((sale) => (
                        <div key={sale.id} className="px-6 py-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  sale.source === 'ticket' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {sale.source === 'ticket' ? '🧾 Ticket' : '✏️ Manual'}
                                </span>
                                {sale.sale_time && (
                                  <span className="text-sm text-gray-500">
                                    {sale.sale_time.slice(0, 5)}
                                  </span>
                                )}
                                {sale.payment_method && (
                                  <span className="text-sm text-gray-400">
                                    • {sale.payment_method}
                                  </span>
                                )}
                              </div>
                              
                              {/* Items */}
                              <div className="mt-2 space-y-1">
                                {sale.sale_items?.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {item.quantity}x {item.product_name}
                                    </span>
                                    <span className="text-gray-500">
                                      €{item.total?.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {sale.notes && (
                                <p className="text-xs text-gray-400 mt-2">{sale.notes}</p>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-gray-900">
                                €{sale.total?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
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