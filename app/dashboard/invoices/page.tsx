import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DashboardNav from '@/components/DashboardNav'
import Link from 'next/link'

interface Invoice {
  id: string
  user_id: string
  date: string | null
  created_at: string
  total: number | null
  tax: number | null
  vendor: string | null
  description: string | null
  category: string | null
}

export default async function InvoicesPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Obtener facturas ordenadas por fecha
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const invoiceList: Invoice[] = invoices || []
  const totalGasto = invoiceList.reduce((sum, inv) => sum + (inv.total || 0), 0)

  // Agrupar facturas por fecha
  const invoicesByDate: Record<string, Invoice[]> = {}
  
  invoiceList.forEach((invoice) => {
    const date = invoice.date || invoice.created_at?.split('T')[0] || 'sin-fecha'
    if (!invoicesByDate[date]) {
      invoicesByDate[date] = []
    }
    invoicesByDate[date].push(invoice)
  })

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facturas de Compra</h1>
              <p className="mt-2 text-gray-600">Gastos y facturas de proveedores</p>
            </div>
            <Link
              href="/dashboard/upload"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              📤 Subir Factura
            </Link>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Gasto Total</p>
                <p className="text-2xl font-bold text-red-600">€{totalGasto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceList.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Promedio por Factura</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{invoiceList.length > 0 ? (totalGasto / invoiceList.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de facturas agrupadas por fecha */}
          <div className="space-y-6">
            {Object.keys(invoicesByDate).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <span className="text-4xl block mb-2">📄</span>
                <p className="text-gray-500">No hay facturas registradas</p>
                <Link
                  href="/dashboard/upload"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Subir primera factura →
                </Link>
              </div>
            ) : (
              Object.entries(invoicesByDate).map(([date, dateInvoices]) => {
                const dateTotal = dateInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
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
                      <span className="text-red-600 font-semibold">
                        €{dateTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Facturas del día */}
                    <div className="divide-y">
                      {dateInvoices.map((invoice) => (
                        <Link 
                          key={invoice.id} 
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  invoice.category === 'Productos' 
                                    ? 'bg-blue-100 text-blue-700'
                                    : invoice.category === 'Servicios'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {invoice.category || 'Sin categoría'}
                                </span>
                              </div>
                              
                              <p className="font-medium text-gray-900 mt-2">
                                {invoice.vendor || 'Proveedor desconocido'}
                              </p>
                              
                              {invoice.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {invoice.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-gray-900">
                                €{invoice.total?.toFixed(2)}
                              </p>
                              {invoice.tax && (
                                <p className="text-xs text-gray-400">
                                  IVA: €{invoice.tax.toFixed(2)}
                                </p>
                              )}
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