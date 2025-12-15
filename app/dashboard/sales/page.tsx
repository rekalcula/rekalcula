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

  // Obtener ventas del usuario
  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('user_id', userId)
    .order('sale_date', { ascending: false })
    .limit(50)

  const totalSales = (sales || []).reduce((sum, sale) => sum + (sale.total || 0), 0)

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
              <p className="mt-2 text-gray-600">Historial de ventas registradas</p>
            </div>
            <Link
              href="/dashboard/sales/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              + Nueva Venta
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">€{totalSales.toFixed(2)}</p>
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

          {/* Lista de ventas */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {!sales || sales.length === 0 ? (
              <div className="p-12 text-center">
                <span className="text-4xl block mb-2">🛒</span>
                <p className="text-gray-500">No hay ventas registradas</p>
                <Link
                  href="/dashboard/sales/new"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Registrar primera venta →
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Productos</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {new Date(sale.sale_date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{sale.source}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {sale.sale_items?.length || 0} producto(s)
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">€{sale.total?.toFixed(2)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}